package dev.alvarodevicente.b2borders.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class OrderDtos {

    private OrderDtos() {
    }

    /** customerId is ignored for CUSTOMER users: they always order for their own company. */
    public record CreateOrderRequest(
            Long customerId,
            @NotEmpty(message = "El pedido necesita al menos una línea") @Valid List<OrderLineRequest> lines) {
    }

    public record UpdateLinesRequest(
            @NotEmpty(message = "El pedido necesita al menos una línea") @Valid List<OrderLineRequest> lines) {
    }

    public record OrderLineRequest(
            @NotNull(message = "El producto es obligatorio") Long productId,
            @NotNull(message = "La cantidad es obligatoria")
            @Min(value = 1, message = "La cantidad mínima es 1")
            @Max(value = 10000, message = "La cantidad máxima por línea es 10000") Integer quantity) {
    }

    public record OrderSummaryResponse(Long id, Long customerId, String customerName, OrderStatus status,
                                       BigDecimal total, Instant createdAt, Instant confirmedAt) {

        public static OrderSummaryResponse from(Order order) {
            return new OrderSummaryResponse(order.getId(), order.getCustomer().getId(),
                    order.getCustomer().getName(), order.getStatus(), order.getTotal(), order.getCreatedAt(),
                    order.getConfirmedAt());
        }
    }

    public record OrderResponse(Long id, Long customerId, String customerName, String createdByName,
                                OrderStatus status, BigDecimal total, Instant createdAt, Instant confirmedAt,
                                Instant updatedAt, List<OrderLineResponse> lines,
                                Set<OrderAction> availableActions) {

        public static OrderResponse from(Order order, Set<OrderAction> actions) {
            return new OrderResponse(order.getId(), order.getCustomer().getId(), order.getCustomer().getName(),
                    order.getCreatedBy().getFullName(), order.getStatus(), order.getTotal(), order.getCreatedAt(),
                    order.getConfirmedAt(), order.getUpdatedAt(),
                    order.getLines().stream().map(OrderLineResponse::from).toList(), actions);
        }
    }

    public record OrderLineResponse(Long productId, String sku, String productName, String brandName,
                                    int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {

        public static OrderLineResponse from(OrderLine line) {
            var product = line.getProduct();
            return new OrderLineResponse(product.getId(), product.getSku(), product.getName(),
                    product.getBrand().getName(), line.getQuantity(), line.getUnitPrice(), line.getLineTotal());
        }
    }
}
