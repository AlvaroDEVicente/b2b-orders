package dev.alvarodevicente.b2borders.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.alvarodevicente.b2borders.TestcontainersConfiguration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

// Real PostgreSQL with the demo data and a frozen clock. No rollback between tests on purpose:
// it would hide errors that only show up when Hibernate flushes.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"demo", "local"})
@Import({TestcontainersConfiguration.class, FixedClockConfiguration.class})
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
}
