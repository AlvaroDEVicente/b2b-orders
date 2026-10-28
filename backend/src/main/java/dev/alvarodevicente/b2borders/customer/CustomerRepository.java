package dev.alvarodevicente.b2borders.customer;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @EntityGraph(attributePaths = "salesRep")
    List<Customer> findAllByOrderByNameAsc();

    @EntityGraph(attributePaths = "salesRep")
    List<Customer> findBySalesRepIdOrderByNameAsc(Long salesRepId);

    boolean existsByTaxIdIgnoreCase(String taxId);

    boolean existsByTaxIdIgnoreCaseAndIdNot(String taxId, Long id);
}
