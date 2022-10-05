
import {
    GenericContainer,
    Wait,
} from 'testcontainers';
import { HealthCheck } from 'testcontainers/dist/docker/types';
import { WaitStrategy } from 'testcontainers/dist/wait-strategy';
import { ContainerOptions, ContainerInstance } from './BaseContainers'

export interface SDKOptions extends ContainerOptions {
    unleashApiUrl: string, // example: http://localhost:4242/api
    apiToken: string,
    sdkImpl?: string,
}
export abstract class SDKContainerInstance extends ContainerInstance {
    protected options: SDKOptions
    constructor(port: number, options: SDKOptions) {
        super(port, options)
        this.options = options
    }
}

export interface HealthCheckConfig {
    healthCheck?: HealthCheck,
    waitStrategy: WaitStrategy
}
export class SDKDockerfileContainer extends SDKContainerInstance {
    private buildContext: string
    private healthCheckConfig
    constructor(buildContext: string, port: number, options: SDKOptions, healthCheck?: HealthCheckConfig) {
        super(port, options)
        this.buildContext = buildContext
        const defaultWgetHealthCheck = {
            test: `wget -q -O - http://localhost:${this.getInternalPort()}/ready || exit 1`,
            interval: 200,
            timeout: 1500,
            retries: 20,
            startPeriod: 500
        }
        this.healthCheckConfig = healthCheck || {
            healthCheck: defaultWgetHealthCheck,
            waitStrategy: Wait.forHealthCheck(),
        }
    }

    // conventional configuration that can be overriden if necessary
    protected async start() {
        let containerBuilder = GenericContainer.fromDockerfile(this.buildContext, "Dockerfile")
        if (this.options.sdkImpl) {
            containerBuilder = containerBuilder.withBuildArg('UNLEASH_CLIENT_IMPL', this.options.sdkImpl)
        }
        const container = await containerBuilder.build();
        let builder = container
            .withEnv('UNLEASH_URL', this.options.unleashApiUrl)
            .withEnv('UNLEASH_API_TOKEN', this.options.apiToken)
            .withEnv('PORT', this.getInternalPort().toString())
            .withExposedPorts(this.getInternalPort())
            .withNetworkMode(this.options.network.getName())
            .withWaitStrategy(this.healthCheckConfig.waitStrategy);
        if (this.healthCheckConfig.healthCheck) {
            builder = builder.withHealthCheck(this.healthCheckConfig.healthCheck)
        }
        return builder.start();
      }
}
