# Two stages: build with Maven and the full JDK, run with a small JRE image.
# The final image does not contain Maven, the sources or the build cache.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Dependencies first: Docker caches this layer and only re-downloads them when pom.xml changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Tests run in CI (they need Docker for Testcontainers), not inside the image build.
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Never run the app as root inside the container.
RUN addgroup -S app && adduser -S app -G app
USER app
COPY --from=build /app/target/b2b-orders-api-*.jar app.jar
EXPOSE 8080
# MaxRAMPercentage: let the JVM use most of the container's memory limit, not a fixed heap size.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
