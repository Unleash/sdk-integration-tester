import {
    GenericContainer,
    Wait,
} from 'testcontainers';
import * as path from 'path';
import * as fs from 'fs';
import { ContainerOptions, RestartMethod, UnleashServerInstance, UnleashServerInstanceWrapper, UnleashServerInterface } from '../../lib/BaseContainers'
import { TestConfiguration, UnleashConfig } from '../../lib/Config';
import { mockServerClient } from 'mockserver-client'
import { MockServerClient } from 'mockserver-client/mockServerClient';

class EdgeServerContainer extends UnleashServerInstance {
    private unleashServer: UnleashServerInterface
    private readonly unleashConfig: UnleashConfig
    private client?: MockServerClient
    constructor(unleashConfig: UnleashConfig, port: number, options: ContainerOptions, unleashServer: UnleashServerInterface) {
        super(port, options)
        this.unleashServer = unleashServer
        this.unleashConfig = unleashConfig
    }

    async start() {
        this.client = mockServerClient(this.unleashServer.getInternalIpAddress(), this.unleashServer.getInternalPort());
        // TODO /validate is required before Edge is ready which makes it less reliable
        // Maybe if we have a valid local store this is not needed. We need to check
        await this.setExpectation({ method: 'POST', path:'/edge/validate' }, `{
            "tokens":[
                {
                    "projects":[],
                    "type":"admin",
                    "token":"${this.unleashConfig.adminToken}",
                    "environment":"development"
                }
            ]
        }`)

        //await this.setExpectation({ method: 'POST', path:'/api/client/register' }, `{}`)
        
        // Note: first need to checkout this repo
        const buildContext = path.resolve('./unleash-on-the-edge', '.');
        const container = await GenericContainer.fromDockerfile(buildContext, "Dockerfile")
                        .build()
        const tmpFile = '/tmp/config.yml' // TODO create temporary file
        fs.writeFileSync(tmpFile, 
            fs.readFileSync(`${__dirname}/config.tpl.yml`).toString()
                .replace('${unleashUrl}', `http://${this.unleashServer.getInternalIpAddress()}:${this.unleashServer.getInternalPort()}`)
                .replace('${apiToken}', this.unleashConfig.adminToken)
        );
        return container
            .withCopyFileToContainer(tmpFile, '/unleash-edge/config.yml')
            .withExposedPorts(this.getInternalPort())
            .withNetworkMode(this.network.getName())
            .withHealthCheck({
                test: `wget -q -O - http://localhost:${this.getInternalPort()}/backstage/health || exit 1`,
                interval: 200,
                timeout: 2000,
                retries: 40,
                startPeriod: 1000
            })
            .withWaitStrategy(Wait.forHealthCheck())
            .start()
    }

    async setExpectation(request: {
        method: string,
        path: string
    }, response: string) {
        let result = await this.client!.mockAnyResponse({
            httpRequest: {
                path: request.path,
                method: request.method,
            },
            httpResponse: {
                statusCode: 200,
                body: response
            },
            //priority: this.priority ++
        }).then(response => true, rejected => false)
        return result
    }

    async setState(state: Record<string, any>) {
        return this.unleashServer.setState(state)
    }
}

export function create(config: TestConfiguration, options: ContainerOptions): UnleashServerInterface {
    let mockServer: UnleashServerInterface = require('../MockServer/container').create(config, options)
    let edgeServer = new EdgeServerContainer(config.unleash, 3001, options, mockServer)

    return new UnleashServerInstanceWrapper(edgeServer, mockServer)
}
