## Running the tests:
**Note:** Before running the tests it's necessary to run `yarn` to install the dependencies
1. `./run-tests.sh`

### Troubleshooting
First try to cleanup: `docker compose rm -f`

If that does not work, you may have to manually delete the docker images (`docker images`) related with this project (`docker rmi <image>`)