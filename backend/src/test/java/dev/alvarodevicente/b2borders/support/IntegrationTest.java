package dev.alvarodevicente.b2borders.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.alvarodevicente.b2borders.TestcontainersConfiguration;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Base class for integration tests: the whole application (security, controllers, services, JPA)
 * against a real PostgreSQL with the demo data loaded.
 *
 * Time is frozen at 28 October 2026 so date rules (license validity, token expiry, report periods)
 * give the same result whenever the tests run.
 *
 * Tests do not roll back: they create their own orders and check relative changes, so they do not
 * depend on each other. Rolling back would also hide errors that only appear when Hibernate flushes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import({TestcontainersConfiguration.class, IntegrationTest.FixedClock.class})
public abstract class IntegrationTest {

    public static final Instant NOW = Instant.parse("2026-10-28T10:00:00Z");
    protected static final String PASSWORD = "demo1234";
    protected static final String ADMIN = "admin@example.com";
    protected static final String SALES_MARCOS = "marcos.comercial@example.com";
    protected static final String SALES_IRENE = "irene.comercial@example.com";
    protected static final String CUSTOMER_CANTABRICO = "cliente.cantabrico@example.com";
    protected static final String CUSTOMER_VERA = "cliente.vera@example.com";

    @Autowired
    protected MockMvc mockMvc;

    protected String tokenFor(String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClock {

        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(NOW, ZoneId.of("Europe/Madrid"));
        }
    }
}
