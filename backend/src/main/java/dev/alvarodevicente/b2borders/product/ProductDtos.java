package dev.alvarodevicente.b2borders.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public final class ProductDtos {

    private ProductDtos() {
    }

    public record ProductRequest(
            @NotBlank(message = "El SKU es obligatorio") @Size(max = 40) String sku,
            @NotBlank(message = "El nombre es obligatorio") @Size(max = 160) String name,
            @NotNull(message = "La marca es obligatoria") Long brandId,
            @NotNull(message = "El precio es obligatorio")
            @DecimalMin(value = "0.01", message = "El precio debe ser mayor que 0")
            @Digits(integer = 8, fraction = 2) BigDecimal unitPrice,
            @NotNull(message = "El stock es obligatorio")
            @PositiveOrZero(message = "El stock no puede ser negativo") Integer stock,
            Boolean active) {
    }

    public record ProductResponse(Long id, String sku, String name, Long brandId, String brandName,
                                  BigDecimal unitPrice, int stock, boolean active) {

        public static ProductResponse from(Product product) {
            return new ProductResponse(product.getId(), product.getSku(), product.getName(),
                    product.getBrand().getId(), product.getBrand().getName(), product.getUnitPrice(),
                    product.getStock(), product.isActive());
        }
    }
}
