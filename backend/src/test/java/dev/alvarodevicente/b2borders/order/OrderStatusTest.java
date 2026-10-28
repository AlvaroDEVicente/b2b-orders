package dev.alvarodevicente.b2borders.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Every possible pair of statuses, written as a table: easy to read against the diagram in OrderStatus. */
class OrderStatusTest {

    @ParameterizedTest(name = "{0} -> {1}: {2}")
    @CsvSource({
            "DRAFT,     CONFIRMED, true",
            "DRAFT,     CANCELLED, true",
            "DRAFT,     SHIPPED,   false",
            "DRAFT,     DELIVERED, false",
            "DRAFT,     DRAFT,     false",
            "CONFIRMED, SHIPPED,   true",
            "CONFIRMED, CANCELLED, true",
            "CONFIRMED, DRAFT,     false",
            "CONFIRMED, DELIVERED, false",
            "SHIPPED,   DELIVERED, true",
            "SHIPPED,   CANCELLED, false",
            "SHIPPED,   CONFIRMED, false",
            "DELIVERED, CANCELLED, false",
            "DELIVERED, SHIPPED,   false",
            "CANCELLED, DRAFT,     false",
            "CANCELLED, CONFIRMED, false"
    })
    void allowsOnlyTheTransitionsOfTheLifeCycle(OrderStatus from, OrderStatus to, boolean allowed) {
        assertThat(from.canTransitionTo(to)).isEqualTo(allowed);
    }
}
