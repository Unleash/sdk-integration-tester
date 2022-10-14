import specs from '@unleash/client-specification/specifications/index.json'
import got from 'got'
import YAML from 'yaml'
import fs from 'fs'
import { Network, StartedNetwork } from 'testcontainers'
import {
  MockServerConfig,
  OSSServerConfig,
  parseResult,
  TestConfiguration,
  TestYamlConfig
} from './lib/Config'
import { ContainerInstance, UnleashServerInterface } from './lib/BaseContainers'
import { SDKOptions } from './lib/SDKContainers'

const rawConfig = fs.readFileSync(
  `./src/${process.env.CONFIG || 'all-against-mock'}.yaml`,
  'utf8'
)
const parsedConfig = YAML.parse(rawConfig) as TestYamlConfig

const sdks = process.env.SDK
  ? [{ name: process.env.SDK, type: process.env.SDK }]
  : parsedConfig.sdks.map(c => {
      c.name = c.name || c.type
      return c
    })

const servers = process.env.SERVER
  ? [{ type: process.env.SERVER }]
  : parsedConfig.servers

const testDetails = parsedConfig.tests.load

const excludeTests = testDetails.excluding || []

function parseConfig(
  server: OSSServerConfig | MockServerConfig
): TestConfiguration {
  let config: TestConfiguration
  if (server.type === 'OSSServer') {
    const ossServer = server as OSSServerConfig
    config = {
      serverImpl: ossServer.type,
      postgres: {
        image: ossServer.postgresImage,
        dbName: 'unleash',
        user: 'unleash_user',
        password: 'unleash.the.password'
      },
      unleash: {
        image: ossServer.image,
        clientToken: parsedConfig.clientToken,
        adminToken: parsedConfig.adminToken
      }
    }
  } else if (server.type === 'MockServer' || server.type === 'Edge') {
    // This is pointless, we should remove TestConfiguration
    config = {
      serverImpl: server.type,
      postgres: {
        image: '',
        dbName: '',
        user: '',
        password: ''
      },
      unleash: {
        image: '',
        clientToken: parsedConfig.clientToken,
        adminToken: parsedConfig.adminToken
      }
    }
  } else {
    throw new Error(`Invalid server config type ${server.type}`)
  }
  return config
}

const tests: string[] = specs.filter(
  spec => !excludeTests.includes(spec.slice(0, 2))
)

describe.each(servers)(`$type`, server => {
  let unleashServer: ContainerInstance & UnleashServerInterface
  let network: StartedNetwork
  let initialized = false
  let sdkContainers = new Map<string, ContainerInstance>()
  let config = parseConfig(server)
  describe.each(tests)(`%s suite`, testName => {
    // eslint-disable-next-line
    const definition: ISpecDefinition = require(`@unleash/client-specification/specifications/${testName}`)

    beforeAll(async () => {
      if (!initialized) {
        console.log(
          `===== Initializing Unleash ${server.type} ${definition.name} =====`
        )
        network = await new Network().start()
        unleashServer = require('./servers/index').create(config, network)
        await unleashServer.initialize()
        initialized = true
      } else {
        console.log(
          `===== Reseting Unleash ${server.type} before ${definition.name} =====`
        )
        await unleashServer.reset()
      }

      // ========= set unleash state (~50ms)
      let succeed = await unleashServer.setState(definition.state)
      expect(succeed).toBeTruthy()
    })

    describe.each(sdks)(`$name SDK`, sdkTestConfig => {
      const excludedForSDK = sdkTestConfig.excluding || []
      if (excludedForSDK.filter(s => testName.startsWith(s)).length > 0) {
        // This is to have a better reporting when we exclude some things
        test(`Ignored test ${testName} for ${sdkTestConfig.type}`, () => {
          expect(1).toBeGreaterThan(0)
        })
        return;
      }
      let sdkUrl: string

      beforeAll(async () => {
        let sdkContainer = sdkContainers.get(sdkTestConfig.type)
        if (!sdkContainer) {
          // console.log(`===== Initializing ${sdk} =====`)
          let options: SDKOptions = {
            unleashApiUrl: `http://${unleashServer.getInternalIpAddress()}:${unleashServer.getInternalPort()}/api`,
            apiToken: config.unleash.adminToken,
            network: network,
            sdkImpl: sdkTestConfig.client
          }
          let { create } = require(`./sdks/${sdkTestConfig.type}/container`)
          sdkContainer = create(options) as ContainerInstance
          await sdkContainer.initialize()
          sdkContainers.set(sdkTestConfig.name!, sdkContainer)
        } else {
          // cleanup cached SDK state
          // console.log(`===== Reseting state of ${sdk} =====`)
          await sdkContainer.reset()
        }
        sdkUrl = `http://localhost:${sdkContainer.getMappedPort()}`
      })

      if (definition.tests) {
        test.each(definition.tests)(`$description`, async testCase => {
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
        test.each(definition.variantTests)(`$description`, async testCase => {
          const { body, statusCode } = await got.post(`${sdkUrl}/variant`, {
            json: {
              toggle: testCase.toggleName,
              context: testCase.context
            }
          })
          expect(statusCode).toBe(200)
          const variantResult: VariantResult = JSON.parse(body)
          const result = parseResult(sdkTestConfig.name!, variantResult)
          expect(result).toEqual(testCase.expectedResult)
        })
      }
    })
  })
})
