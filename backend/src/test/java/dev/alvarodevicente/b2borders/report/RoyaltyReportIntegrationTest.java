package dev.alvarodevicente.b2borders.report;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.alvarodevicente.b2borders.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class RoyaltyReportIntegrationTest extends IntegrationTest {

    @Test
    void sumsSalesPerBrandForThePeriod() throws Exception {
        mockMvc.perform(get("/api/reports/royalties")
                        .param("from", "2026-07-01").param("to", "2026-09-30")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(ADMIN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows.length()").value(3))
                .andExpect(jsonPath("$.rows[0].brandName").value("Aurora Studio"))
                .andExpect(jsonPath("$.rows[0].netSales").value(970.00))
                .andExpect(jsonPath("$.rows[0].royalty").value(82.45))
                .andExpect(jsonPath("$.rows[1].brandName").value("Kraken Sports"))
                .andExpect(jsonPath("$.rows[1].units").value(90))
                .andExpect(jsonPath("$.rows[1].royalty").value(106.92))
                .andExpect(jsonPath("$.rows[2].brandName").value("Pixel Pals"))
                .andExpect(jsonPath("$.rows[2].royalty").value(107.50))
                .andExpect(jsonPath("$.totalNetSales").value(2936.00))
                .andExpect(jsonPath("$.totalRoyalty").value(296.87));
    }

    @Test
    void onlyAdminsCanSeeIt() throws Exception {
        mockMvc.perform(get("/api/reports/royalties")
                        .param("from", "2026-07-01").param("to", "2026-09-30")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(SALES_MARCOS))))
                .andExpect(status().isForbidden());
    }
}
