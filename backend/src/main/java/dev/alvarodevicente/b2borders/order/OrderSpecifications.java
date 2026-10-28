package dev.alvarodevicente.b2borders.order;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import org.springframework.data.jpa.domain.Specification;

final class OrderSpecifications {

    private OrderSpecifications() {
    }

    static Specification<Order> hasStatus(OrderStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    static Specification<Order> hasCustomer(Long customerId) {
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    // same rule as CurrentUser.canAccess, as a WHERE clause for lists
    static Specification<Order> visibleTo(CurrentUser current) {
        return switch (current.role()) {
            case ADMIN -> (root, query, cb) -> cb.conjunction(); // always true
            case SALES -> (root, query, cb) -> cb.equal(root.get("customer").get("salesRep").get("id"), current.id());
            case CUSTOMER -> hasCustomer(current.customerId());
        };
    }
}
