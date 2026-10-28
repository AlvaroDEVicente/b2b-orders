package dev.alvarodevicente.b2borders.report;

import dev.alvarodevicente.b2borders.report.RoyaltyReportService.RoyaltyReport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Informes")
public class ReportController {

    private final RoyaltyReportService royaltyReportService;

    public ReportController(RoyaltyReportService royaltyReportService) {
        this.royaltyReportService = royaltyReportService;
    }

    @GetMapping("/royalties")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Royalties por marca entre dos fechas, ambas incluidas (solo ADMIN)")
    public RoyaltyReport royalties(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return royaltyReportService.generate(from, to);
    }
}
