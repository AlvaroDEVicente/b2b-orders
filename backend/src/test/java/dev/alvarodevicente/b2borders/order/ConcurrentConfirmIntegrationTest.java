package dev.alvarodevicente.b2borders.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.jayway.jsonpath.JsonPath;
import dev.alvarodevicente.b2borders.support.IntegrationTest;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

class ConcurrentConfirmIntegrationTest extends IntegrationTest {

    private static final int ORDERS = 6;
    private static final int UNITS = 2;

    @Test
    void concurrentConfirmationsWithEnoughStockAllSucceed() throws Exception {
        String sales = tokenFor(SALES_MARCOS);
        String admin = tokenFor(ADMIN);
        int stockBefore = stockOf(admin, 2);

        List<Long> orderIds = new ArrayList<>();
        for (int i = 0; i < ORDERS; i++) {
            String body = mockMvc.perform(post("/api/orders")
                            .header(HttpHeaders.AUTHORIZATION, bearer(sales))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"customerId\":1,\"lines\":[{\"productId\":2,\"quantity\":" + UNITS + "}]}"))
                    .andReturn().getResponse().getContentAsString();
            orderIds.add(((Number) JsonPath.read(body, "$.id")).longValue());
        }

        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(ORDERS);
        List<Future<Integer>> results = new ArrayList<>();
        for (Long id : orderIds) {
            Callable<Integer> confirm = () -> {
                start.await();
                return mockMvc.perform(post("/api/orders/{id}/confirm", id)
                                .header(HttpHeaders.AUTHORIZATION, bearer(sales)))
                        .andReturn().getResponse().getStatus();
            };
            results.add(pool.submit(confirm));
        }
        start.countDown(); // release every thread at once
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> result : results) {
            statuses.add(result.get());
        }
        pool.shutdown();

        assertThat(statuses).containsOnly(200);
        assertThat(stockOf(admin, 2)).isEqualTo(stockBefore - ORDERS * UNITS);
    }

    private int stockOf(String token, long productId) throws Exception {
        String body = mockMvc.perform(get("/api/products/{id}", productId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.stock");
    }
}
