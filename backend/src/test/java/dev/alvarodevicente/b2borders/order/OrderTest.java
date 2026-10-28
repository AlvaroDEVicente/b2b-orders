package dev.alvarodevicente.b2borders.order;

import static dev.alvarodevicente.b2borders.support.TestData.brand;
import static dev.alvarodevicente.b2borders.support.TestData.customer;
import static dev.alvarodevicente.b2borders.support.TestData.product;
import static dev.alvarodevicente.b2borders.support.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.alvarodevicente.b2borders.brand.Brand;
import dev.alvarodevicente.b2borders.common.ConflictException;
import dev.alvarodevicente.b2borders.product.Product;
import dev.alvarodevicente.b2borders.user.AppUser;
import dev.alvarodevicente.b2borders.user.Role;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Plain unit tests of the Order entity: no Spring, no database, run in milliseconds. */
class OrderTest {

    private static final Instant NOW = Instant.parse("2026-10-28T10:00:00Z");

    private Product caseA;
    private Product caseB;
    private Order order;

    @BeforeEach
    void setUp() {
        Brand brand = brand(1, "Kraken Sports", "12.00");
        caseA = product(1, brand, "9.90", 100);
        caseB = product(2, brand, "4.20", 10);
        AppUser rep = user(1, Role.SALES, null);
        order = new Order(customer(1, rep), rep, NOW);
    }

    @Test
    void calculatesLineTotalsAndOrderTotalWithExactDecimals() {
        order.replaceLines(lines(caseA, 3, caseB, 2), NOW);

        assertThat(order.getLines()).extracting(OrderLine::getLineTotal)
                .containsExactly(new BigDecimal("29.70"), new BigDecimal("8.40"));
        assertThat(order.getTotal()).isEqualByComparingTo("38.10");
    }

    @Test
    void editingLinesUpdatesExistingOnesAndRemovesTheRest() {
        order.replaceLines(lines(caseA, 3, caseB, 2), NOW);

        order.replaceLines(Map.of(caseA, 5), NOW);

        assertThat(order.getLines()).singleElement()
                .satisfies(line -> assertThat(line.getQuantity()).isEqualTo(5));
        assertThat(order.getTotal()).isEqualByComparingTo("49.50");
    }

    @Test
    void confirmingTakesStockAndRecordsTheDate() {
        order.replaceLines(lines(caseA, 30, caseB, 10), NOW);

        order.confirm(NOW);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(order.getConfirmedAt()).isEqualTo(NOW);
        assertThat(caseA.getStock()).isEqualTo(70);
        assertThat(caseB.getStock()).isZero();
    }

    @Test
    void confirmingWithoutEnoughStockTakesNothing() {
        order.replaceLines(lines(caseA, 30, caseB, 11), NOW);

        assertThatThrownBy(() -> order.confirm(NOW))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Stock insuficiente para SKU-2");
        assertThat(caseA.getStock()).isEqualTo(100);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.DRAFT);
    }

    @Test
    void cancellingAConfirmedOrderReturnsTheStock() {
        order.replaceLines(lines(caseA, 30, caseB, 5), NOW);
        order.confirm(NOW);

        order.cancel(NOW);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(caseA.getStock()).isEqualTo(100);
        assertThat(caseB.getStock()).isEqualTo(10);
    }

    @Test
    void cancellingADraftDoesNotTouchStock() {
        order.replaceLines(lines(caseA, 30, caseB, 5), NOW);

        order.cancel(NOW);

        assertThat(caseA.getStock()).isEqualTo(100);
    }

    @Test
    void linesCannotChangeOnceConfirmed() {
        order.replaceLines(lines(caseA, 1, caseB, 1), NOW);
        order.confirm(NOW);

        assertThatThrownBy(() -> order.replaceLines(Map.of(caseA, 2), NOW))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void cannotSkipSteps() {
        order.replaceLines(lines(caseA, 1, caseB, 1), NOW);

        assertThatThrownBy(() -> order.ship(NOW))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Un pedido en estado DRAFT no puede pasar a SHIPPED");
    }

    private static Map<Product, Integer> lines(Product first, int firstQty, Product second, int secondQty) {
        Map<Product, Integer> lines = new LinkedHashMap<>();
        lines.put(first, firstQty);
        lines.put(second, secondQty);
        return lines;
    }
}
