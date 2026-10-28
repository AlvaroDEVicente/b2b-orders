package dev.alvarodevicente.b2borders.brand;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class BrandDtos {

    private BrandDtos() {
    }

    public record BrandRequest(
            @NotBlank(message = "El nombre es obligatorio") @Size(max = 80) String name,
            @NotNull(message = "El porcentaje de royalty es obligatorio")
            @DecimalMin(value = "0.00", message = "El royalty no puede ser negativo")
            @DecimalMax(value = "100.00", message = "El royalty no puede superar el 100 %")
            @Digits(integer = 3, fraction = 2) BigDecimal royaltyRate,
            Boolean active) {
    }

    public record BrandResponse(Long id, String name, BigDecimal royaltyRate, boolean active) {

        public static BrandResponse from(Brand brand) {
            return new BrandResponse(brand.getId(), brand.getName(), brand.getRoyaltyRate(), brand.isActive());
        }

        public BrandResponse withoutRoyaltyRate() {
            return new BrandResponse(id, name, null, active);
        }
    }
}
