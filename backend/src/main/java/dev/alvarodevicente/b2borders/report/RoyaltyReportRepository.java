package dev.alvarodevicente.b2borders.report;

import dev.alvarodevicente.b2borders.order.OrderLine;
import dev.alvarodevicente.b2borders.order.OrderStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface RoyaltyReportRepository extends Repository<OrderLine, Long> {

    @Query("""
            select new dev.alvarodevicente.b2borders.report.RoyaltyAggregate(
                b.id, b.name, b.royaltyRate, sum(l.quantity), sum(l.lineTotal))
            from OrderLine l
              join l.order o
              join l.product p
              join p.brand b
            where o.status in :statuses
              and o.confirmedAt >= :from and o.confirmedAt < :to
            group by b.id, b.name, b.royaltyRate
            order by b.name
            """)
    List<RoyaltyAggregate> aggregateByBrand(@Param("statuses") Collection<OrderStatus> statuses,
                                            @Param("from") Instant from, @Param("to") Instant to);
}
