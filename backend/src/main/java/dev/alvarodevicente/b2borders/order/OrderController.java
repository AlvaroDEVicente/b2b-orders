package dev.alvarodevicente.b2borders.order;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.common.PageResponse;
import dev.alvarodevicente.b2borders.order.OrderDtos.CreateOrderRequest;
import dev.alvarodevicente.b2borders.order.OrderDtos.OrderResponse;
import dev.alvarodevicente.b2borders.order.OrderDtos.OrderSummaryResponse;
import dev.alvarodevicente.b2borders.order.OrderDtos.UpdateLinesRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Status changes are separate POST endpoints (/confirm, /ship...) instead of "PUT status=SHIPPED":
 * each one is a business action with its own rules and permissions, and reads clearly in the API docs.
 */
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Pedidos")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Pedidos visibles para el usuario, paginados y filtrables")
    public PageResponse<OrderSummaryResponse> search(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long customerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            CurrentUser current) {
        return orderService.search(status, customerId, pageable, current);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un pedido con sus líneas y acciones disponibles")
    public OrderResponse findById(@PathVariable Long id, CurrentUser current) {
        return orderService.findById(id, current);
    }

    @PostMapping
    @Operation(summary = "Crea un pedido en borrador")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request,
                                                CurrentUser current) {
        OrderResponse created = orderService.createDraft(request, current);
        return ResponseEntity.created(URI.create("/api/orders/" + created.id())).body(created);
    }

    @PutMapping("/{id}/lines")
    @Operation(summary = "Sustituye las líneas de un pedido en borrador")
    public OrderResponse replaceLines(@PathVariable Long id, @Valid @RequestBody UpdateLinesRequest request,
                                      CurrentUser current) {
        return orderService.replaceLines(id, request.lines(), current);
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirma el pedido: comprueba licencias y descuenta stock")
    public OrderResponse confirm(@PathVariable Long id, CurrentUser current) {
        return orderService.confirm(id, current);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancela el pedido; si estaba confirmado devuelve el stock")
    public OrderResponse cancel(@PathVariable Long id, CurrentUser current) {
        return orderService.cancel(id, current);
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @Operation(summary = "Marca el pedido como enviado (ADMIN o SALES)")
    public OrderResponse ship(@PathVariable Long id, CurrentUser current) {
        return orderService.ship(id, current);
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @Operation(summary = "Marca el pedido como entregado (ADMIN o SALES)")
    public OrderResponse deliver(@PathVariable Long id, CurrentUser current) {
        return orderService.deliver(id, current);
    }
}
