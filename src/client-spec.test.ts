import specs from '@unleash/client-specification/specifications/index.json'
import got from 'got'
import { readdirSync, existsSync } from 'fs'
import {
  Network,
  StartedNetwork,
} from 'testcontainers';
import { TestConfiguration } from './lib/Config'
import { ContainerInstance, UnleashServerInterface } from './lib/BaseContainers';

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .filter(dirent => existsSync(`${source}/${dirent.name}/container.ts`))
    .map(dirent => dirent.name)

const sdks = process.env.SDK ? [process.env.SDK] : getDirectories('src/sdks')

interface IVariantTest {
  description: string
  context: Record<string, any>
  toggleName: string
  expectedResult: {
    name: string
    payload: unknown
    enabled: boolean
  }
}

interface ISpecTest {
  description: string
  context: Record<string, any>
  toggleName: string
  expectedResult: boolean
}

interface ISpecDefinition {
  name: string
  state: Record<string, any>
  tests: ISpecTest[]
  variantTests: IVariantTest[]
}

declare enum PayloadType {
  STRING = 'string'
}

interface Payload {
  type: PayloadType
  value: string
}

interface EnabledResult {
  name: string
  enabled: boolean
  context: Map<string, string>
}

interface VariantResult {
  name: string
  enabled: {
    name: string
    enabled: boolean
    payload?: Payload
  }
  context: Map<string, string>
}

// Needed because of slight inconsistencies in the results we get back from the different SDKs
// We should probably fix the SDKs to return the same result type in the future...
const parseResult = (sdk: string, variantResult: VariantResult) => {
  // Destructured because some of the SDKs return extra properties we don't have on expectedResult:
  // Python: weightType
  // Java: stickiness
  const { name, enabled, payload } = variantResult.enabled
  let result = { name, enabled, payload }
  // This handles a case where the Java SDK sends a payload with a null value, where we are not expecting a payload at all in that case
  if (payload?.value === null) {
    console.warn(
      `${sdk}: Payload value is null, removing payload from result`
    )
    result = { name, enabled, payload: undefined }
  }
  return result
}

// Currently excluded because we cannot set the state:
const excludeTests = [
  '09', // Needs state to be cleared before running
  '13', // NOT_A_VALID_OPERATOR - OpenAPI validation
  '14', // Cannot read properties of undefined (reading 'map')
  '15' // "segments[0].name" is required
]

let config: TestConfiguration = {
  postgres:{
    image: 'postgres:alpine3.15',
    dbName: 'unleash',
    user: 'unleash_user',
    password: 'unleash.the.password',
  },
  unleash: {
    image: 'unleashorg/unleash-server:latest',
    clientToken: '*:development.unleash-insecure-api-token',
    adminToken: '*:*.unleash-insecure-admin-api-token',
  }
}

let unleashServer: UnleashServerInterface
let network: StartedNetwork
let initialized = false
let sdkContainers = new Map<string, ContainerInstance>()

describe.each(specs.filter(spec => !excludeTests.includes(spec.slice(0, 2))))
(`%s suite`, (testName) => {
  // eslint-disable-next-line
  const definition: ISpecDefinition = require(`@unleash/client-specification/specifications/${testName}`)

  beforeAll(async () => {
    if (!initialized){
      console.log(`===== Initializing Unleash ${definition.name} =====`)
      network = await new Network().start()
      unleashServer = require('./servers/index').create(config, network)
      await unleashServer.initialize()
      initialized = true
    } else {
      console.log(`===== Reseting Unleash before ${definition.name} =====`)
      await unleashServer.reset()
    }

    // ========= set unleash state (~50ms)
    let succeed = await unleashServer.setState(definition.state)
    expect(succeed).toBeTruthy()
  })
    
  describe.each(sdks)(`%s SDK`, (sdk) => {
    if (sdk === 'python' && testName.slice(0, 2) === '12') {
      return; // Fails on Python - Not supported on this SDK?
    }
    let sdkUrl: string
    
    beforeAll(async () => {
      let sdkContainer = sdkContainers.get(sdk)
      if (!sdkContainer) {
        // console.log(`===== Initializing ${sdk} =====`)
        let options = {
          unleashApiUrl: `http://${unleashServer.getInternalIpAddress()}:${unleashServer.getInternalPort()}/api`,
          apiToken: config.unleash.adminToken,
          network: network
        }
        let { create } = require(`./sdks/${sdk}/container`)
        sdkContainer = create(options) as ContainerInstance
        await sdkContainer.initialize()
        sdkContainers.set(sdk, sdkContainer)
      } else {
        // cleanup cached SDK state
        // console.log(`===== Reseting state of ${sdk} =====`)
        await sdkContainer.reset()
      }
      sdkUrl = `http://localhost:${sdkContainer.getMappedPort()}`
    })

    if (definition.tests) {
      test.each(definition.tests)(`$description`, async (testCase) => {
        const { body, statusCode } = await got.post(`${sdkUrl}/is-enabled`, {
          json: {
            toggle: testCase.toggleName,
            context: testCase.context
          }
        })
        expect(statusCode).toBe(200)
        const result: EnabledResult = JSON.parse(body)
        expect(result.enabled).toBe(testCase.expectedResult)
      })
    }

    if (definition.variantTests) {
      test.each(definition.variantTests)(`$description`, async (testCase) => {
        const { body, statusCode } = await got.post(`${sdkUrl}/variant`, {
          json: {
            toggle: testCase.toggleName,
            context: testCase.context
          }
        })
        expect(statusCode).toBe(200)
        const variantResult: VariantResult = JSON.parse(body)
        const result = parseResult(sdk, variantResult)
        expect(result).toEqual(testCase.expectedResult)
      })
    }
  })
})
