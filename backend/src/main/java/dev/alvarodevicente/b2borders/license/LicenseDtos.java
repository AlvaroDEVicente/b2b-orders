package dev.alvarodevicente.b2borders.license;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public final class LicenseDtos {

    private LicenseDtos() {
    }

    public record LicenseRequest(
            @NotNull(message = "El cliente es obligatorio") Long customerId,
            @NotNull(message = "La marca es obligatoria") Long brandId,
            @NotNull(message = "La fecha de inicio es obligatoria") LocalDate startDate,
            @NotNull(message = "La fecha de fin es obligatoria") LocalDate endDate) {

        @AssertTrue(message = "La fecha de fin no puede ser anterior a la de inicio")
        public boolean isEndDateValid() {
            return startDate == null || endDate == null || !endDate.isBefore(startDate);
        }
    }

    public record LicenseResponse(Long id, Long customerId, String customerName, Long brandId, String brandName,
                                  LocalDate startDate, LocalDate endDate, boolean validToday) {

        public static LicenseResponse from(License license, LocalDate today) {
            return new LicenseResponse(license.getId(), license.getCustomer().getId(),
                    license.getCustomer().getName(), license.getBrand().getId(), license.getBrand().getName(),
                    license.getStartDate(), license.getEndDate(), license.isValidOn(today));
        }
    }
}
