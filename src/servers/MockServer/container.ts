import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { ContainerOptions, ContainerInterface, ContainerInstance, UnleashServerInterface } from '../../lib/BaseContainers'
import { TestConfiguration } from '../../lib/Config';
import { mockServerClient } from 'mockserver-client'
import { MockServerClient } from 'mockserver-client/mockServerClient';

class MockServerContainer extends ContainerInstance implements UnleashServerInterface {
    private client?: MockServerClient
    private priority = 1
    constructor(options: ContainerOptions) {
        super(1080, options)
    }

    protected start(): Promise<StartedTestContainer> {
        let mockserver = new GenericContainer('mockserver/mockserver')
            .withEnv('MOCKSERVER_SERVER_PORT', this.getInternalPort().toString())
            .withEnv('MOCKSERVER_LOG_LEVEL', 'TRACE')
            .withNetworkMode(this.network.getName())
            .withExposedPorts(this.getInternalPort())
            .withWaitStrategy(Wait.forLogMessage(`started on port: ${this.getInternalPort()}`));
        return mockserver.start()
    }

    async initialize() {
        await super.initialize()
        this.client = mockServerClient('localhost', this.getMappedPort());

        await this.client.mockAnyResponse({
            httpRequest: {
                path: '/api/client/register',
                method: 'POST',
            },
            httpResponse: {
                statusCode: 202,
            },
        })
    }

    async setState(state: Record<string, any>) {
        let result = await this.client!.mockAnyResponse({
            httpRequest: {
                path: '/api/client/features',
                method: 'GET',
            },
            httpResponse: {
                statusCode: 200,
                body: state
            },
            priority: this.priority ++
        }).then(response => true, rejected => false)
        return result
    }

    async reset() {
        await this.client?.clear('/api/client/features', 'EXPECTATIONS')
    }
}

export function create(config: TestConfiguration, options: ContainerOptions): ContainerInterface {
    let mockserver = new MockServerContainer(options) 
    return mockserver
}
