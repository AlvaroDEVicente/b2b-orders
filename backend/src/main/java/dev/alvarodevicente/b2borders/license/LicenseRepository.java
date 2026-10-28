package dev.alvarodevicente.b2borders.license;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LicenseRepository extends JpaRepository<License, Long> {

    @Query("""
            select distinct l.brand.id from License l
            where l.customer.id = :customerId
              and :date between l.startDate and l.endDate
            """)
    Set<Long> findValidBrandIds(@Param("customerId") Long customerId, @Param("date") LocalDate date);

    @Query("""
            select count(l) > 0 from License l
            where l.customer.id = :customerId and l.brand.id = :brandId
              and l.startDate <= :endDate and l.endDate >= :startDate
            """)
    boolean existsOverlapping(@Param("customerId") Long customerId, @Param("brandId") Long brandId,
                              @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @EntityGraph(attributePaths = {"brand", "customer"})
    List<License> findByCustomerIdOrderByStartDateDesc(Long customerId);
}
