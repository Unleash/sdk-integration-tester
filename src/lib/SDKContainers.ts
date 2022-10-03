
import {
    GenericContainer,
    Wait,
} from 'testcontainers';
import {ContainerOptions, ContainerInstance} from './BaseContainers'

export interface SDKOptions extends ContainerOptions {
    unleashApiUrl: string, // example: http://localhost:4242/api
    apiToken: string,
}
export abstract class SDKContainerInstance extends ContainerInstance {
    protected options: SDKOptions
    constructor(port: number, options: SDKOptions) {
        super(port, options)
        this.options = options
    }
}

export class SDKDockerfileContainer extends SDKContainerInstance {
    private buildContext: string
    constructor(buildContext: string, port: number, options: SDKOptions) {
        super(port, options)
        this.buildContext = buildContext
    }

    // conventional configuration that can be overriden if necessary
    protected async start() {
        const container = await GenericContainer.fromDockerfile(this.buildContext, "Dockerfile")
          .build();
        return container
          .withEnv('UNLEASH_URL', this.options.unleashApiUrl)
          .withEnv('UNLEASH_API_TOKEN', this.options.apiToken)
          .withEnv('PORT', this.getInternalPort().toString())
          .withExposedPorts(this.getInternalPort())
          .withNetworkMode(this.options.network.getName())
          .withHealthCheck({
            test: `wget -q -O - http://localhost:${this.getInternalPort()}/ready || exit 1`,
            interval: 200,
            timeout: 1500,
            retries: 20,
            startPeriod: 500
          })
          .withWaitStrategy(Wait.forHealthCheck())
          .start();
      }
}
