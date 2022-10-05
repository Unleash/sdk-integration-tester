import got from 'got'
import {
    GenericContainer,
    Wait,
} from 'testcontainers';
import { ContainerInstance, ContainerOptions, UnleashServerInterface } from '../../lib/BaseContainers'
import { PostgresConfig, TestConfiguration, UnleashConfig } from '../../lib/Config';

class PostgresContainer extends ContainerInstance {
    readonly config: PostgresConfig
    constructor (config: PostgresConfig, port: number, options: ContainerOptions){
        super(port, options)
        this.config = config
    }
    
    async start() {
        const postgresContainer = new GenericContainer(this.config.image)
            .withEnv('POSTGRES_USER', this.config.user)
            .withEnv('POSTGRES_PASSWORD', this.config.password)
            .withEnv('POSTGRES_DB', this.config.dbName)
            .withExposedPorts(this.getInternalPort())
            .withNetworkMode(this.network.getName())
            .withHealthCheck({
                test: `psql --dbname=${this.config.dbName} --username=${this.config.user} -c 'select 1' || exit 1`,
                interval: 200,
                timeout: 1000,
                retries: 20,
                startPeriod: 1000
            })
            .withWaitStrategy(Wait.forHealthCheck());
        return postgresContainer.start();
    }

    query(psqlQuery: string) {
        return this.getInstance().exec([
            ...`psql -U ${this.config.user} -d ${this.config.dbName} -c`.split(' '),
            psqlQuery
        ])
    }

    async reset() {
        // this speeds up the reset from ~1500ms using docker to ~100ms
        await this.getInstance().exec(
            `dropdb -U ${this.config.user} ${this.config.dbName} --force && 
             createdb -U ${this.config.user} ${this.config.dbName}`.split(' ')
        )
    }
}

interface DBConfiguration {
    // host and port are only known after db initialization
    host: () => Promise<string>,
    port: () => Promise<number>,
    dbName: string,
    user: string,
    password: string,
    ssl: boolean
}
class UnleashServerContainer extends ContainerInstance {
    private readonly dbConfig: DBConfiguration
    readonly config: UnleashConfig
    constructor(config: UnleashConfig, port: number, options:ContainerOptions, dbConfig: DBConfiguration) {
        super(port, options)
        this.config = config
        this.dbConfig = dbConfig
    }

    async start() {
        const container = new GenericContainer(this.config.image)
            .withEnv('DATABASE_HOST', await this.dbConfig.host())
            .withEnv('DATABASE_PORT', (await this.dbConfig.port()).toString())
            .withEnv('DATABASE_NAME', this.dbConfig.dbName)
            .withEnv('DATABASE_USERNAME', this.dbConfig.user)
            .withEnv('DATABASE_PASSWORD', this.dbConfig.password)
            .withEnv('DATABASE_SSL', this.dbConfig.ssl.toString())
            .withEnv('INIT_CLIENT_API_TOKENS', this.config.clientToken)
            .withEnv('INIT_ADMIN_API_TOKENS', this.config.adminToken)
            .withEnv('LOG_LEVEL', 'info')
            .withNetworkMode(this.network.getName())
            .withExposedPorts(this.getInternalPort())
            .withHealthCheck({
                test: `wget -q -O - --header='Authorization:${this.config.adminToken}' http://localhost:${this.getInternalPort()}/api/admin/api-tokens || exit 1`,
                interval: 200,
                timeout: 2000,
                retries: 40,
                startPeriod: 1000
            })
            .withWaitStrategy(Wait.forHealthCheck());
        return await container.start()
    }


    async get(uri: string) {
        if (!uri.startsWith('http')) {
            uri = `http://localhost:${this.getInternalPort()}${uri}`
        }
        const cmd = `wget -q -O - --header 'Authorization:${this.config.adminToken}' ${uri}`
        return this.getInstance().exec(cmd.split(' '))
    }

}

export function create(config: TestConfiguration, options: ContainerOptions): UnleashServerInterface {
    let postgres = new PostgresContainer(config.postgres, 5432, options)
    let dbConfig: DBConfiguration = {
        host: async () => postgres.getInternalIpAddress(),
        port: async () => postgres.getInternalPort(),
        dbName: postgres.config.dbName,
        user: postgres.config.user,
        password: postgres.config.password,
        ssl: false
    }
    let unleashServer = new UnleashServerContainer(config.unleash, 4242, options, dbConfig)

    let wrapper: UnleashServerInterface = {
        async start() {
            await postgres.start()
            return unleashServer.start()
        },
    
        async stop() {
            await unleashServer.stop()
            await postgres.stop()
        },
    
        async reset() {
            await postgres.reset()
            await unleashServer.reset()
        },

        getInternalIpAddress() {
            return unleashServer.getInternalIpAddress()
        },

        getInternalPort() {
            return unleashServer.getInternalPort()
        },

        getMappedPort() {
            return unleashServer.getMappedPort()
        },

        // TODO can we convert `state` into a SQL query to Postgres?
        async setState(state) {
            const { statusCode } = await got.post(
                `http://localhost:${unleashServer.getMappedPort()}/api/admin/state/import`,
                {
                    headers: {
                        Authorization: unleashServer.config.adminToken
                    },
                    json: state
                }
            )
            return statusCode === 202
        },
    }

    return wrapper
}
