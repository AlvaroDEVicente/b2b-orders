package dev.alvarodevicente.b2borders.product;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.alvarodevicente.b2borders.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

class CatalogIntegrationTest extends IntegrationTest {

    @Test
    void customersOnlySeeBrandsTheyAreLicensedFor() throws Exception {
        mockMvc.perform(get("/api/products").param("size", "100")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(CUSTOMER_CANTABRICO))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].brandName",
                        everyItem(org.hamcrest.Matchers.oneOf("Kraken Sports", "Aurora Studio"))));
    }

    @Test
    void searchFiltersByTextAndBrandAndPaginates() throws Exception {
        String admin = tokenFor(ADMIN);
        mockMvc.perform(get("/api/products").param("q", "galaxy").param("brandId", "1")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].sku", containsInAnyOrder("KRK-CAS-S25")));

        mockMvc.perform(get("/api/products").param("size", "5").param("page", "1")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.content.length()").value(5));
    }

    @Test
    void customersCannotOpenProductsOutsideTheirLicenses() throws Exception {
        mockMvc.perform(get("/api/products/7")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(CUSTOMER_CANTABRICO))))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/products/7").header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(SALES_MARCOS))))
                .andExpect(status().isOk());
    }

    @Test
    void onlyAdminsSeeRoyaltyRates() throws Exception {
        mockMvc.perform(get("/api/brands").header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(CUSTOMER_CANTABRICO))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].royaltyRate").doesNotExist());
        mockMvc.perform(get("/api/brands").header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(ADMIN))))
                .andExpect(jsonPath("$[0].royaltyRate").exists());
    }

    @Test
    void sortingByAnUnknownFieldIsABadRequest() throws Exception {
        mockMvc.perform(get("/api/products").param("sort", "foo")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(ADMIN))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("No se puede ordenar por 'foo'."));
    }

    @Test
    void duplicatedSkuIsAConflict() throws Exception {
        mockMvc.perform(post("/api/products")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(ADMIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"krk-cas-ip17\",\"name\":\"Copia\",\"brandId\":1,\"unitPrice\":1,\"stock\":1}"))
                .andExpect(status().isConflict());
    }

    @Test
    void licensesShowWhetherTheyAreValidToday() throws Exception {
        mockMvc.perform(get("/api/customers/1/licenses")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(CUSTOMER_CANTABRICO))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.brandName == 'Pixel Pals')].validToday", everyItem(is(false))))
                .andExpect(jsonPath("$[?(@.brandName == 'Kraken Sports')].validToday", everyItem(is(true))));
    }

    @Test
    void overlappingLicenseIsAConflictAndInvertedDatesAreInvalid() throws Exception {
        String admin = tokenFor(ADMIN);
        mockMvc.perform(post("/api/licenses")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":1,\"brandId\":1,\"startDate\":\"2027-01-01\",\"endDate\":\"2027-06-30\"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/licenses")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":2,\"brandId\":2,\"startDate\":\"2027-06-30\",\"endDate\":\"2027-01-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.endDateValid").exists());
    }
}
