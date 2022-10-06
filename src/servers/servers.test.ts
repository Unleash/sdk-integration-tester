import got from 'got'
import { readdirSync, existsSync } from 'fs'
import { TestConfiguration } from '../lib/Config'
import { Network } from 'testcontainers';
import { UnleashServerInstance } from '../lib/BaseContainers';

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .filter(dirent => existsSync(`${source}/${dirent.name}/container.ts`))
    .map(dirent => dirent.name)


let testData = {
  features: [
    {
      name: "minimum-feature",
      strategies: [],
    },
  ],
}
// allow developers to define which servers to test using a CSV string
let servers = process.env.SERVER?.split(',') || getDirectories(__dirname)
describe('Test server containers', () => {
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
  it.each(servers)(`%s works`, async (serverImpl) => {
    let network = await new Network().start()
    config.serverImpl = serverImpl
    let unleash: UnleashServerInstance = require('./index').create(config, network)
    await unleash.initialize()
    await unleash.setState({features: []})
    let response = await got.get(
      `http://localhost:${unleash.getMappedPort()}/api/client/features`, 
      {
        headers: {
          Authorization: config.unleash.adminToken,
        },
      }
    )
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).features).toEqual([])
    
    // most unleash server implementation will have some sort of cache this helps avoiding it
    await unleash.reset()
    await unleash.setState(testData)
    response = await got.get(
      `http://localhost:${unleash.getMappedPort()}/api/client/features`, 
      {
        headers: {
            Authorization: config.unleash.adminToken,
        },
      }
    )
    expect(response.statusCode).toBe(200)
    const responseBody = JSON.parse(response.body)
    expect(responseBody.features.length).toBe(1)
    expect(responseBody.features[0].name).toBe(testData.features[0].name)
  })
})
