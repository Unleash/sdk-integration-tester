export interface PostgresConfig {
    image: string,
    dbName: string,
    user: string,
    password: string,
}

export interface UnleashConfig {
    image: string,
    clientToken: string,
    adminToken: string,
}
export interface TestConfiguration {
    serverImpl?: string,
    postgres: PostgresConfig,
    unleash: UnleashConfig,
}