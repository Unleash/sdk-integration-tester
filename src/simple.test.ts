import got from 'got'

import { readdirSync, existsSync } from 'fs'
import {
  Network,
  StartedNetwork,
} from 'testcontainers';
import { TestConfiguration } from './lib/Config'
import { ContainerInstance, UnleashServerInterface } from './lib/BaseContainers';
const ADMIN_TOKEN = '*:*.unleash-insecure-admin-api-token'

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

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .filter(dirent => existsSync(`${source}/${dirent.name}/container.ts`))
    .map(dirent => dirent.name)
    
const sdks = process.env.SDK? [process.env.SDK] : getDirectories('src/sdks')
describe("SDK tests", () => {
  let unleashServer: UnleashServerInterface
  let network: StartedNetwork

  beforeEach(async () => {
    try {
      network = await new Network().start()
      unleashServer = require('./servers/index').create(config, network)
      await unleashServer.initialize()
    } catch (err) {
      console.log(err)
    }
  });

  async function setState(file: string) {
    // TODO: this is a global state defined for all tests and reseted before each
    // we need the state to be defined by the test either as a DB state or a json that can be imported
    const state = require(file)
    
    await unleashServer.setState(state)
  }

  it.each(sdks)('SDK %p', async (sdk: string) => {
    await setState('./simple.test.state.json')

    let options = {
      unleashApiUrl: `http://${unleashServer.getInternalIpAddress()}:${unleashServer.getInternalPort()}/api`,
      apiToken: ADMIN_TOKEN,
      network: network
    }
    let { create } = require(`./sdks/${sdk}/container`)
    let sdkContainer: ContainerInstance = create(options)
    await sdkContainer.initialize()
    const { body, statusCode } = await got.post(`http://localhost:${sdkContainer.getMappedPort()}/is-enabled`, {
      headers: {
        Authorization: ADMIN_TOKEN
      },
      json: {
        toggle: 'test-on',
        context: {
          userId: '123'
        }
      }
    })
    console.log(body)
    expect(statusCode).toBe(200)
    let res = JSON.parse(body)
    expect(res.name).toBe('test-on')
    expect(res.enabled).toBeTruthy()
    expect(res.context.userId).toBe('123')
  });
});
