import specs from '@unleash/client-specification/specifications/index.json'
import got from 'got'
import YAML from 'yaml'
import fs from 'fs'
import { GenericContainer, Network, StartedNetwork } from 'testcontainers'
import {
  MockServerConfig,
  OSSServerConfig,
  parseResult,
  TestConfiguration,
  TestYamlConfig
} from './lib/Config'
import { ContainerInstance, UnleashServerInterface } from './lib/BaseContainers'
import { SDKOptions } from './lib/SDKContainers'

const path = require("path");
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

function partition<T>(arr: T[], check: (o: T) => boolean): T[][] {
  let initialValue: T[][] = [[], []]
  return arr.reduce((result, element) => {
    result[check(element) ? 0 : 1].push(element)
    return result
  }, initialValue)
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
        
        if (process.env.DEBUG) {
          const ngrepContainer = await GenericContainer
            .fromDockerfile(path.resolve('./src/tools/ngrep'), 'Dockerfile')
            .build()
          await ngrepContainer
            .withNetworkMode("host") // bind to host network cause it will listen to docker bridged network
            .withBindMount(path.resolve('.'), '/output')
            .withCmd([
              "-q", // Be quiet; don't output any information other than packet headers and their payloads (if relevant).
              "-t", // Print a timestamp in the form of YYYY/MM/DD HH:MM:SS.UUUUUU everytime a packet is matched.
              "-l", // Make stdout line buffered
              "-Wbyline", // Specify alternate manner for displaying packets
              `-dbr-${network.getId().slice(0, 12)}`, // listen to the bridge interface created for this network id
              ".*HTTP.*", // match only HTTP
              "/output/ngrep-http.out" // this last parameter will be used as output file
            ])
            .start()
        }

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

      const splitFn = (t: ITestDef) => excludedForSDK.filter(s => testName.startsWith(s) || t.description.startsWith(s)).length > 0
      const [skip, evaluate] = partition(definition.tests || [], splitFn)
      if (skip.length > 0) test.skip.each(skip)(`$description`, () => {});
      if (evaluate.length > 0) {
        test.each(evaluate)(`$description`, async testCase => {
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

      const [skipVariants, evaluateVariants] = partition(definition.variantTests || [], splitFn)
      if (skipVariants.length > 0) test.skip.each(skipVariants)(`$description`, () => {});
      if (evaluateVariants.length > 0) {
        test.each(evaluateVariants)(`$description`, async testCase => {
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
