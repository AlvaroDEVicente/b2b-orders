package dev.alvarodevicente.b2borders.order;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Override
    @EntityGraph(attributePaths = "customer")
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);

    /** Everything the detail view needs, loaded in one query. */
    @EntityGraph(attributePaths = {"customer", "customer.salesRep", "createdBy", "lines", "lines.product",
            "lines.product.brand"})
    Optional<Order> findDetailedById(Long id);
}
