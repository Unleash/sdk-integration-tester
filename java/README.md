# How to run locally

## 1. Compile

```
./gradlew build
java -jar build/libs/unleash-sdk-tester-0.0.1-SNAPSHOT.jar 

# If you want to run against a specified instance
UNLEASH_API_TOKEN="some_unleash_token" UNLEASH_URL="https://some_unleash_url" java -jar build/libs/unleash-sdk-tester-0.0.1-SNAPSHOT.jar 
```

## 2. Fetch toggles

```
curl localhost:8080/is-enabled/TOGGLE_NAME
```
