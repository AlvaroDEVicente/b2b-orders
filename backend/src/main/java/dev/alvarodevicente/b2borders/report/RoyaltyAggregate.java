package dev.alvarodevicente.b2borders.report;

import java.math.BigDecimal;

/** One row of the SQL aggregation, before the royalty amount is calculated. */
public record RoyaltyAggregate(Long brandId, String brandName, BigDecimal royaltyRate, Long units,
                               BigDecimal netSales) {
}
