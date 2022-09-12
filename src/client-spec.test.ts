import specs from '@unleash/client-specification/specifications/index.json'
import got from 'got'

const URL = process.env.SDK_URL || 'http://localhost:3000'
const UNLEASH_URL = process.env.UNLEASH_URL || 'http://localhost:4242'
const UNLEASH_TOKEN =
  process.env.UNLEASH_TOKEN || '*:*.unleash-insecure-admin-api-token'

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

interface IsEnabledResult {
  name: string
  variant?: {
    name: string
    enabled: boolean
    payload?: Payload
  }
  enabled: boolean
  context: Map<string, string>
}

// Currently excluded because we cannot set the state:
const excludeTests = [
  '09', // Needs state to be cleared before running
  '13', // NOT_A_VALID_OPERATOR - OpenAPI validation
  '14', // Cannot read properties of undefined (reading 'map')
  '15' // "segments[0].name" is required
]

specs
  .filter(spec => !excludeTests.includes(spec.slice(0, 2)))
  .forEach(testName => {
    // eslint-disable-next-line
    const definition: ISpecDefinition = require(`@unleash/client-specification/specifications/${testName}`)

    describe(`${testName}`, () => {
      // TODO: we need to make sure state is set correctly before running the tests below
      // TODO: we should clear state between each spec run
      beforeAll(async () => {
        const { statusCode } = await got.post(
          `${UNLEASH_URL}/api/admin/state/import`,
          {
            headers: {
              Authorization: UNLEASH_TOKEN
            },
            json: definition.state
          }
        )
        expect(statusCode).toBe(202)
      })

      if (definition.tests) {
        definition.tests.forEach(testCase => {
          test(`${testName}:${testCase.description}`, async () => {
            const { body, statusCode } = await got.post(`${URL}/is-enabled`, {
              json: {
                toggle: testCase.toggleName,
                context: testCase.context
              }
            })
            expect(statusCode).toBe(200)
            const result: IsEnabledResult = JSON.parse(body)
            expect(result.enabled).toBe(testCase.expectedResult)
          })
        })
      }

      if (definition.variantTests) {
        definition.variantTests.forEach(testCase => {
          test(`${testName}:${testCase.description}`, async () => {
            const { body, statusCode } = await got.post(`${URL}/variant`, {
              json: {
                toggle: testCase.toggleName,
                context: testCase.context
              }
            })
            expect(statusCode).toBe(200)
            const result: IsEnabledResult = JSON.parse(body)
            expect(result.enabled).toEqual(testCase.expectedResult)
          })
        })
      }
    })
  })
