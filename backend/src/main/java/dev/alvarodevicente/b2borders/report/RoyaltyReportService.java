package dev.alvarodevicente.b2borders.report;

import dev.alvarodevicente.b2borders.common.BusinessRuleException;
import dev.alvarodevicente.b2borders.config.AppConfig;
import dev.alvarodevicente.b2borders.order.OrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoyaltyReportService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final List<OrderStatus> SALE_STATUSES =
            Arrays.stream(OrderStatus.values()).filter(OrderStatus::isSale).toList();

    private final RoyaltyReportRepository repository;

    public RoyaltyReportService(RoyaltyReportRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public RoyaltyReport generate(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BusinessRuleException("La fecha final no puede ser anterior a la inicial");
        }
        // both dates inclusive, in Spanish time
        Instant start = from.atStartOfDay(AppConfig.BUSINESS_ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(AppConfig.BUSINESS_ZONE).toInstant();

        List<RoyaltyReport.Row> rows = repository.aggregateByBrand(SALE_STATUSES, start, end).stream()
                .map(RoyaltyReportService::toRow)
                .toList();

        BigDecimal totalSales = rows.stream().map(RoyaltyReport.Row::netSales).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRoyalty = rows.stream().map(RoyaltyReport.Row::royalty).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new RoyaltyReport(from, to, rows, totalSales, totalRoyalty);
    }

    static RoyaltyReport.Row toRow(RoyaltyAggregate aggregate) {
        BigDecimal royalty = aggregate.netSales()
                .multiply(aggregate.royaltyRate())
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        return new RoyaltyReport.Row(aggregate.brandId(), aggregate.brandName(), aggregate.royaltyRate(),
                aggregate.units(), aggregate.netSales(), royalty);
    }

    public record RoyaltyReport(LocalDate from, LocalDate to, List<Row> rows, BigDecimal totalNetSales,
                                BigDecimal totalRoyalty) {

        public record Row(Long brandId, String brandName, BigDecimal royaltyRate, long units, BigDecimal netSales,
                          BigDecimal royalty) {
        }
    }
}
