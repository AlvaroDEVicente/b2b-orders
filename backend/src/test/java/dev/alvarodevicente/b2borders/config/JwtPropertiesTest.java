package dev.alvarodevicente.b2borders.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import org.junit.jupiter.api.Test;

/** Without a strong secret the API must refuse to start rather than sign tokens anyone could forge. */
class JwtPropertiesTest {

    @Test
    void missingSecretStopsTheApplication() {
        assertThatThrownBy(() -> new JwtProperties("", Duration.ofHours(8), "b2b-orders-api"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void shortSecretStopsTheApplication() {
        assertThatThrownBy(() -> new JwtProperties("too-short", Duration.ofHours(8), "b2b-orders-api"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void secretOf32BytesIsAccepted() {
        assertThatCode(() -> new JwtProperties("x".repeat(32), Duration.ofHours(8), "b2b-orders-api"))
                .doesNotThrowAnyException();
    }
}
