# How to run locally

## 1. Setup

```
npm install
node index.js

# If you want to run against a specified instance
UNLEASH_API_TOKEN="some_unleash_token" UNLEASH_URL="https://some_unleash_url" node index.js
```

## 2. Fetch toggles

```
curl localhost:3000/is-enabled/TOGGLE_NAME
```
