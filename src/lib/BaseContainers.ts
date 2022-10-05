
import {
    StartedTestContainer,
    StartedNetwork,
} from 'testcontainers';

export interface ContainerLifecycle {
    start(): Promise<StartedTestContainer>
    stop(): Promise<void>
    reset(): Promise<void>
}
export interface ContainerInterface extends ContainerLifecycle {
    getInternalIpAddress(): string
    getInternalPort(): number
    getMappedPort(): number
}

export interface UnleashServerInterface extends ContainerInterface {
    setState(state: Record<string, any>): Promise<boolean>
}

export abstract class ContainerInstance implements ContainerInterface {
    protected network: StartedNetwork
    private instance?: StartedTestContainer
    private port: number
    private restartMethod: RestartMethod
    constructor(port: number, options: ContainerOptions) {
        this.network = options.network
        this.port = port
        this.restartMethod = options.restartMethod || RestartMethod.RESTART
    }

    getInstance() {
        if (!this.instance) {
            throw Error('Invalid state: container is not started')
        }
        return this.instance
    }

    async initialize() {
        if (!this.instance) {
            this.instance = await this.start()
        }
    }

    async stop() {
        await this.getInstance().stop()
        this.instance = undefined
    }

    async reset() {
        if (this.restartMethod === RestartMethod.NEW_INSTANCE) {
            this.instance = undefined
            await this.initialize()
        } else {
            await this.getInstance().restart()
        }
    }

    getInternalIpAddress() {
        return this.getInstance().getIpAddress(this.network.getName())
    }

    getInternalPort() {
        return this.port
    }

    /* The port accessible from the host that docker maps to the internal port */
    getMappedPort() {
        return this.getInstance().getMappedPort(this.port)
    }

    abstract start(): Promise<StartedTestContainer>

}

export enum RestartMethod {
    RESTART, NEW_INSTANCE
}
export interface ContainerOptions {
    network: StartedNetwork,
    restartMethod?: RestartMethod
}