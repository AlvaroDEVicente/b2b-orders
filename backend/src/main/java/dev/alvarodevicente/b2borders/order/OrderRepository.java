package dev.alvarodevicente.b2borders.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Override
    @EntityGraph(attributePaths = "customer")
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);

    /** Only the product ids of an order's lines: needed to lock those products before loading anything else. */
    @Query("select l.product.id from OrderLine l where l.order.id = :orderId")
    List<Long> findProductIds(@Param("orderId") Long orderId);

    /** Everything the detail view needs, loaded in one query. */
    @EntityGraph(attributePaths = {"customer", "customer.salesRep", "createdBy", "lines", "lines.product",
            "lines.product.brand"})
    Optional<Order> findDetailedById(Long id);
}
