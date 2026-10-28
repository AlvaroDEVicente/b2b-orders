package dev.alvarodevicente.b2borders.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.alvarodevicente.b2borders.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

class OrderFlowIntegrationTest extends IntegrationTest {

    @Test
    void fullLifeCycleTakesAndReturnsStock() throws Exception {
        String customer = tokenFor(CUSTOMER_CANTABRICO);
        String sales = tokenFor(SALES_MARCOS);
        int stockBefore = stockOf(1);

        long id = createOrder(customer, "{\"lines\":[{\"productId\":1,\"quantity\":10},{\"productId\":4,\"quantity\":3}]}");

        mockMvc.perform(put("/api/orders/{id}/lines", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lines\":[{\"productId\":1,\"quantity\":20}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lines.length()").value(1))
                .andExpect(jsonPath("$.lines[0].quantity").value(20))
                .andExpect(jsonPath("$.total").value(198.00));

        mockMvc.perform(post("/api/orders/{id}/confirm", id).header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.availableActions").isEmpty());
        assertThat(stockOf(1)).isEqualTo(stockBefore - 20);

        mockMvc.perform(post("/api/orders/{id}/cancel", id).header(HttpHeaders.AUTHORIZATION, bearer(sales)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        assertThat(stockOf(1)).isEqualTo(stockBefore);
    }

    @Test
    void salesRepShipsAndDelivers() throws Exception {
        String sales = tokenFor(SALES_MARCOS);
        long id = createOrder(sales, "{\"customerId\":2,\"lines\":[{\"productId\":3,\"quantity\":1}]}");

        for (String action : new String[] {"confirm", "ship", "deliver"}) {
            mockMvc.perform(post("/api/orders/{id}/" + action, id).header(HttpHeaders.AUTHORIZATION, bearer(sales)))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/orders/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(sales)))
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    void cannotOrderABrandWhoseLicenseExpired() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(CUSTOMER_CANTABRICO)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lines\":[{\"productId\":7,\"quantity\":5}]}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail", containsString("no tiene licencia en vigor de la marca Pixel Pals")));
    }

    @Test
    void cannotConfirmWithoutStock() throws Exception {
        String vera = tokenFor(CUSTOMER_VERA); // customer 3 holds a Bosque Design license
        long id = createOrder(vera, "{\"lines\":[{\"productId\":12,\"quantity\":1}]}");

        mockMvc.perform(post("/api/orders/{id}/confirm", id).header(HttpHeaders.AUTHORIZATION, bearer(vera)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail", containsString("Stock insuficiente para BSQ-PRO-CRI")));
    }

    @Test
    void customersOnlySeeTheirOwnOrders() throws Exception {
        String cantabrico = tokenFor(CUSTOMER_CANTABRICO);

        mockMvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, bearer(cantabrico)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].customerId", everyItem(is(1))));

        mockMvc.perform(get("/api/orders/4").header(HttpHeaders.AUTHORIZATION, bearer(cantabrico)))
                .andExpect(status().isNotFound());
    }

    @Test
    void salesRepsOnlySeeTheirCustomers() throws Exception {
        mockMvc.perform(get("/api/customers").header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(SALES_IRENE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name",
                        containsInAnyOrder("TecnoVera Distribución S.L.", "Plaza Mayor Phone S.L.")));

        mockMvc.perform(post("/api/orders")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(SALES_MARCOS)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":3,\"lines\":[{\"productId\":7,\"quantity\":1}]}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void customersCannotShipOrCancelConfirmedOrders() throws Exception {
        String customer = tokenFor(CUSTOMER_CANTABRICO);
        long id = createOrder(customer, "{\"lines\":[{\"productId\":2,\"quantity\":1}]}");
        mockMvc.perform(post("/api/orders/{id}/confirm", id).header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/orders/{id}/ship", id).header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/orders/{id}/cancel", id).header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Un cliente solo puede cancelar pedidos en borrador"));
    }

    @Test
    void invalidStatusChangeIsAConflict() throws Exception {
        String sales = tokenFor(SALES_MARCOS);
        long id = createOrder(sales, "{\"customerId\":1,\"lines\":[{\"productId\":1,\"quantity\":1}]}");

        mockMvc.perform(post("/api/orders/{id}/deliver", id).header(HttpHeaders.AUTHORIZATION, bearer(sales)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Un pedido en estado DRAFT no puede pasar a DELIVERED"));
    }

    private long createOrder(String token, String body) throws Exception {
        String response = mockMvc.perform(post("/api/orders")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().exists(HttpHeaders.LOCATION))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private int stockOf(long productId) throws Exception {
        String response = mockMvc.perform(get("/api/products/{id}", productId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenFor(ADMIN))))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.stock");
    }
}
