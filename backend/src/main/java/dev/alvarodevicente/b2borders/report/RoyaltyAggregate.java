package dev.alvarodevicente.b2borders.report;

import java.math.BigDecimal;

public record RoyaltyAggregate(Long brandId, String brandName, BigDecimal royaltyRate, Long units,
                               BigDecimal netSales) {
}
