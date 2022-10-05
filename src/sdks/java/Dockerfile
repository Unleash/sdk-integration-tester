FROM gradle:7.5.1 AS builder

WORKDIR /javatester

COPY gradle /javatester/gradle
COPY build.gradle gradlew settings.gradle /javatester/

COPY src /javatester/src

ARG UNLEASH_CLIENT_IMPL
RUN gradle -DunleashClientImpl=${UNLEASH_CLIENT_IMPL} bootJar

FROM openjdk:17-slim

WORKDIR /app

COPY --from=builder /javatester/build/libs/unleash-sdk-tester-0.0.1-SNAPSHOT.jar /app/app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

