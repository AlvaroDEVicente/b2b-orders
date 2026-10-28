package dev.alvarodevicente.b2borders.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the app.jwt.* properties in application.yml. */
@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, Duration ttl, String issuer) {

    public JwtProperties {
        // HS256 needs a key of at least 256 bits. Fail at startup rather than issuing weak tokens.
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("Set the JWT_SECRET environment variable to a random value of at least 32 bytes");
        }
    }
}
