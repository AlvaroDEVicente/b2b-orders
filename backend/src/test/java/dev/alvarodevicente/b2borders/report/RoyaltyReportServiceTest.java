package dev.alvarodevicente.b2borders.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import dev.alvarodevicente.b2borders.common.BusinessRuleException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoyaltyReportServiceTest {

    @Mock
    private RoyaltyReportRepository repository;

    @InjectMocks
    private RoyaltyReportService service;

    @Test
    void roundsTheRoyaltyHalfUpToCents() {
        // 1141.00 * 12.00 % = 136.92 exactly; 970.05 * 8.50 % = 82.45425 -> 82.45
        when(repository.aggregateByBrand(any(), any(), any())).thenReturn(List.of(
                new RoyaltyAggregate(1L, "Kraken Sports", new BigDecimal("12.00"), 110L, new BigDecimal("1141.00")),
                new RoyaltyAggregate(2L, "Aurora Studio", new BigDecimal("8.50"), 3L, new BigDecimal("970.05"))));

        var report = service.generate(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));

        assertThat(report.rows()).extracting(RoyaltyReportService.RoyaltyReport.Row::royalty)
                .containsExactly(new BigDecimal("136.92"), new BigDecimal("82.45"));
        assertThat(report.totalNetSales()).isEqualByComparingTo("2111.05");
        assertThat(report.totalRoyalty()).isEqualByComparingTo("219.37");
    }

    @Test
    void rejectsAnInvertedPeriod() {
        assertThatThrownBy(() -> service.generate(LocalDate.of(2026, 12, 31), LocalDate.of(2026, 1, 1)))
                .isInstanceOf(BusinessRuleException.class);
    }
}
