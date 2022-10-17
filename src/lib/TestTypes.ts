

interface ITestDef {
    description: string
    context: Record<string, any>
    toggleName: string
}

interface IVariantTest extends ITestDef {
    expectedResult: {
        name: string
        payload: unknown
        enabled: boolean
    }
}

interface ISpecTest extends ITestDef {
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