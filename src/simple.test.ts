import got from 'got'

import fs from 'fs'
import { Network, StartedNetwork } from 'testcontainers'
import {
  MockServerConfig,
  OSSServerConfig,
  TestConfiguration,
  TestYamlConfig
} from './lib/Config'
import { ContainerInstance, UnleashServerInterface } from './lib/BaseContainers'
import YAML from 'yaml'
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

function parseConfig(
  server: OSSServerConfig | MockServerConfig
): TestConfiguration {
  let config: TestConfiguration
  if (server.type === 'OSSServer') {
    const ossServer = server as OSSServerConfig
    config = {
      serverImpl: ossServer.type,
      postgres: {
        image: ossServer.postgresImage ?? 'postgres:alpine3.15',
        dbName: 'unleash',
        user: 'unleash_user',
        password: 'unleash.the.password'
      },
      unleash: {
        image: ossServer.image ?? 'unleashorg/unleash-server:latest',
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

describe.each(servers)(`$type`, server => {
  let unleashServer: ContainerInstance & UnleashServerInterface
  let network: StartedNetwork
  let initialized = false
  let sdkContainers = new Map<string, ContainerInstance>()
  let config = parseConfig(server)

  beforeAll(async () => {
    if (!initialized) {
      console.log(`===== Initializing Unleash ${server.type} =====`)
      network = await new Network().start()
      unleashServer = require('./servers/index').create(config, network)
      await unleashServer.initialize()
      initialized = true
    } else {
      console.log(`===== Reseting Unleash ${server.type} =====`)
      await unleashServer.reset()
    }

    // ========= set unleash state (~50ms)
    const state = require('./simple.test.state.json')
    let succeed = await unleashServer.setState(state)
    expect(succeed).toBeTruthy()
  })

  describe.each(sdks)(`$name SDK`, sdkTestConfig => {
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

    test('simple test', async () => {
      const { body, statusCode } = await got.post(`${sdkUrl}/is-enabled`, {
        json: {
          toggle: 'test-on',
          context: {
            userId: '123'
          }
        }
      })
      expect(statusCode).toBe(200)
      const result = JSON.parse(body)
      expect(result.name).toBe('test-on')
      expect(result.enabled).toBeTruthy()
      expect(result.context.userId).toBe('123')
    })
  })
})
