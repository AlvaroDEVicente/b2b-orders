package dev.alvarodevicente.b2borders;

import org.springframework.boot.SpringApplication;

/**
 * Runs the API locally with a throw-away PostgreSQL in Docker and the demo data:
 *   ./mvnw spring-boot:test-run
 * No database to install or configure.
 */
public class TestB2bOrdersApiApplication {

    public static void main(String[] args) {
        SpringApplication.from(B2bOrdersApiApplication::main)
                .with(TestcontainersConfiguration.class)
                .withAdditionalProfiles("demo", "local")
                .run(args);
    }
}
