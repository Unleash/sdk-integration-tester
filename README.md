## Running the tests:
1. `docker compose up`
2. `yarn test`
3. After stopping docker compose, do a clean-up: `docker compose rm -f && docker rmi server_node:latest`


**TODO:**
1. Delete the initial admin token (optional because this environment is ephimeral)
`curl -XDELETE -H 'Content-Type: application/json' -H 'Authorization: *:*.unleash-insecure-admin-api-token' localhost:4242/api/admin/api-tokens/*:*.unleash-insecure-admin-api-token`