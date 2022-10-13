export interface PostgresConfig {
  image: string
  dbName: string
  user: string
  password: string
}

export interface UnleashConfig {
  image: string
  clientToken: string
  adminToken: string
}
export interface TestConfiguration {
  serverImpl?: string
  postgres: PostgresConfig
  unleash: UnleashConfig
}

export interface OSSServerConfig {
  type: string
  image: string
  postgresImage: string
}
export interface MockServerConfig {
  type: string
}
// should replace TestConfiguration
export interface TestYamlConfig {
  clientToken: string
  adminToken: string
  servers: (OSSServerConfig | MockServerConfig)[]
  sdks: {
    name?: string // define an alternative name instead of type
    type: string
    excluding?: string[]
    client?: string
  }[]
  tests: {
    load: {
      file: string
      excluding?: string[]
    }
  }
}

// Needed because of slight inconsistencies in the results we get back from the different SDKs
// We should probably fix the SDKs to return the same result type in the future...
export const parseResult = (sdk: string, variantResult: VariantResult) => {
  // Destructured because some of the SDKs return extra properties we don't have on expectedResult:
  // Python: weightType
  // Java: stickiness
  const { name, enabled, payload } = variantResult.enabled
  let result = { name, enabled, payload }
  // This handles a case where the Java SDK sends a payload with a null value, where we are not expecting a payload at all in that case
  if (payload?.value === null) {
    console.warn(`${sdk}: Payload value is null, removing payload from result`)
    result = { ...result, payload: undefined }
  }
  // dotnet: This SDK returns `payload` as null when it is not expected (similar to the Java SDK but `payload` instead of `payload.value`)
  if (payload === null) {
    console.warn(`${sdk}: Payload is null, removing payload from result`)
    result = { ...result, payload: undefined }
  }
  // dotnet: This SDK returns `isEnabled` instead of `enabled`, and `payload` as null when it is not expected
  if ('isEnabled' in variantResult.enabled) {
    console.warn(`${sdk}: Passing isEnabled to enabled`)
    // @ts-expect-error
    result = { ...result, enabled: variantResult.enabled.isEnabled }
  }
  return result
}
