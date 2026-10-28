package dev.alvarodevicente.b2borders.support;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Replaces the real clock in integration tests: "now" is always IntegrationTest.NOW. */
@TestConfiguration(proxyBeanMethods = false)
public class FixedClockConfiguration {

    @Bean
    @Primary
    Clock fixedClock() {
        return Clock.fixed(IntegrationTest.NOW, ZoneId.of("Europe/Madrid"));
    }
}
