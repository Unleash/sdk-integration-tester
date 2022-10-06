Running locally

`go build index.go`

Building/running docker locally

```
docker build -t sdk-integration-tester .
docker run -p 5010:5010 -t sdk-integration-tester
```

Failing tests for now
```
 08-variants.json suite › go SDK › Feature.Variants.E should be disabled
 08-variants.json suite › go SDK › Feature.Variants.MissingToggle should be disabled missing toggle
```

```
- Expected  - 0
+ Received  + 4

  Object {
    "enabled": false,
    "name": "disabled",
+   "payload": Object {
+     "type": "",
+     "value": "",
+   },

```
