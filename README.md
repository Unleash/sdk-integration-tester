# How to run
- `yarn test`
- `yarn test:debug`
- `yarn test:node` (or `SDK=node yarn test:debug` for debugging)
- `CONFIG=all-against-mock yarn test` (or `CONFIG=all-against-mock yarn test:debug`)

Note that many options can be combined. This is still a work in progress but as of today you can use SERVER to define the backend you want to use and SDK to pin one SDK implementation. Tests by default will run against all SDKs

# Ideas:
* Each container needs to comply with a pre-defined API contract (this could be defined by OpenAPI, we don't need tests validating they comply because the main tests will fail anyway if they don't)

## Conventions
### Defining new components to test
Inside `src` folder you'll find `sdks` and `servers`. Both allow us to run tests against different configuration setups. 

To add a new server or sdk, you only need to add a folder containing a `container.ts` file. The folder name will work as its name.

Each `container.ts` file has to export a function called create. The interfaces vary for each case and this is one thing that can be improved.

**For sdks**:
```Typescript
export function create(
    options: SDKOptions): ContainerInstance {
        // define your implementation
}
```

**For servers**:
```Typescript
export function create(
    config: TestConfiguration, 
    options: ContainerOptions): UnleashServerInterface {
        // define your implementation
}
```

### SDK API
Since SDKs we've defined an ad-hoc one that helps us test these SDKs by means of HTTP calls while these SDKs run inside a containerized environment.

It's up to each SDK to implement this interface and properly use the SDK. This adds another layer of complexity, but helps us standardize the tests that have to talk to a single HTTP API rather than having to write tests in multiple languages
