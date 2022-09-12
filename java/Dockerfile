FROM openjdk:17-slim AS builder

WORKDIR /javatester

COPY gradle /javatester/gradle
COPY build.gradle gradlew settings.gradle /javatester/

RUN ./gradlew tasks

COPY src /javatester/src

RUN ./gradlew bootJar

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /javatester/build/libs/unleash-sdk-tester-0.0.1-SNAPSHOT.jar /app/app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

