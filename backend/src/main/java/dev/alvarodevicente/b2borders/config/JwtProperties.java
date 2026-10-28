package dev.alvarodevicente.b2borders.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, Duration ttl, String issuer) {

    public JwtProperties {
        // HS256 needs at least 256 bits; no secret = no startup
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("Set the JWT_SECRET environment variable to a random value of at least 32 bytes");
        }
    }
}
