
import {
    StartedTestContainer,
    StartedNetwork,
} from 'testcontainers';

interface ContainerLifecycle {
    initialize(): Promise<void>
    start(): Promise<StartedTestContainer>
    stop(): Promise<void>
    reset(): Promise<void>
}
// Note: always extend ContainerInstance to benefit from default methods
interface ContainerInterface extends ContainerLifecycle {
    getInternalIpAddress(): string
    getInternalPort(): number
    getMappedPort(): number
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

// Note: always extend UnleashServerInstance to benefit from default methods
export interface UnleashServerInterface extends ContainerInterface {
    setState(state: Record<string, any>): Promise<boolean>
}

export abstract class UnleashServerInstance extends ContainerInstance implements UnleashServerInterface {
    abstract setState(state: Record<string, any>): Promise<boolean>
}

export enum RestartMethod {
    RESTART, NEW_INSTANCE
}
export interface ContainerOptions {
    network: StartedNetwork,
    restartMethod?: RestartMethod
}

export class UnleashServerInstanceWrapper implements UnleashServerInterface {
    private readonly main: UnleashServerInstance
    private readonly secondary: ContainerInterface
    constructor(main: UnleashServerInstance, secondary: ContainerInterface) {
        this.main = main;
        this.secondary = secondary;
    }

    async initialize(): Promise<void> {
        await this.secondary.initialize()
        await this.main.initialize()
    }

    async start() {
        await this.secondary.start()
        return this.main.start()
    }

    async stop() {
        await this.main.stop()
        await this.secondary.stop()
    }

    async reset() {
        await this.secondary.reset()
        await this.main.reset()
    }

    getInternalIpAddress() {
        return this.main.getInternalIpAddress()
    }

    getInternalPort() {
        return this.main.getInternalPort()
    }

    getMappedPort() {
        return this.main.getMappedPort()
    }

    async setState(state: Record<string, any>) {
        return this.main.setState(state)
    }
}