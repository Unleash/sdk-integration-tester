import { StartedNetwork } from "testcontainers";
import { UnleashServerInterface } from "../lib/BaseContainers";
import { TestConfiguration } from "../lib/Config";

export function create(config: TestConfiguration, network: StartedNetwork): UnleashServerInterface {
    const options = { network: network }
    // This helps us support different server implementations for tests
    const impl = process.env.SERVER || config.serverImpl || 'MockServer'
    return require(`./${impl}/container`).create(config, options)
}