import got from 'got'

const URL = process.env.SDK_URL || 'http://localhost:3000'
const UNLEASH_URL = process.env.UNLEASH_URL || 'http://localhost:4242'
const UNLEASH_TOKEN =
  process.env.UNLEASH_TOKEN || '*:*.unleash-insecure-admin-api-token'

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

describe.each([
  { toggle: 'test-on', userId: '123', enabled: true },
  { toggle: 'test-on', userId: '44', enabled: false },
  { toggle: 'test-off', userId: '44', enabled: false },
  { toggle: 'test-gradual', userId: '44', enabled: false },
  { toggle: 'test-gradual', userId: '57', enabled: false },
  { toggle: 'test-gradual', userId: '56', enabled: true }
])(`${URL}/is-enabled`, ({ toggle, userId, enabled }) => {
  // eslint-disable-next-line
  const state = require('./simple.test.state.json')
  beforeAll(async () => {
    const { statusCode } = await got.post(
      `${UNLEASH_URL}/api/admin/state/import`,
      {
        headers: {
          Authorization: UNLEASH_TOKEN
        },
        json: state
      }
    )
    expect(statusCode).toBe(202)
  })

  test(`'${toggle}' should be ${
    enabled ? 'enabled' : 'disabled'
  } for userId=${userId}`, async () => {
    const { body, statusCode } = await got.post(`${URL}/is-enabled`, {
      json: {
        toggle,
        context: {
          userId
        }
      }
    })

    const data: EnabledResult = JSON.parse(body)

    expect(statusCode).toBe(200)
    expect(data.name).toBe(toggle)
    expect(data.enabled).toBe(enabled)
  })
})

describe.each([
  { toggle: 'test-on', userId: '123', variant: 'disabled' },
  { toggle: 'test-variant', userId: '123', variant: 'blue' },
  { toggle: 'test-variant', userId: '445', variant: 'red' },
  { toggle: 'test-variant', userId: '444', variant: 'blue' }
])(`${URL}/variant`, ({ toggle, userId, variant }) => {
  // eslint-disable-next-line
  const state = require('./simple.test.state.json')
  beforeAll(async () => {
    const { statusCode } = await got.post(
      `${UNLEASH_URL}/api/admin/state/import`,
      {
        headers: {
          Authorization: UNLEASH_TOKEN
        },
        json: state
      }
    )
    expect(statusCode).toBe(202)
  })

  test(`'${toggle}' should be ${variant} for userId=${userId}`, async () => {
    const { body, statusCode } = await got.post(`${URL}/variant`, {
      json: {
        toggle,
        context: {
          userId
        }
      }
    })

    const data: VariantResult = JSON.parse(body)

    expect(statusCode).toBe(200)
    expect(data.name).toBe(toggle)
    expect(data.enabled.name).toBe(variant)
  })
})
