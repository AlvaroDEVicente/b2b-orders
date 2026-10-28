package dev.alvarodevicente.b2borders.order;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.common.BusinessRuleException;
import dev.alvarodevicente.b2borders.common.NotFoundException;
import dev.alvarodevicente.b2borders.common.PageResponse;
import dev.alvarodevicente.b2borders.customer.Customer;
import dev.alvarodevicente.b2borders.customer.CustomerService;
import dev.alvarodevicente.b2borders.license.LicenseService;
import dev.alvarodevicente.b2borders.order.OrderDtos.CreateOrderRequest;
import dev.alvarodevicente.b2borders.order.OrderDtos.OrderLineRequest;
import dev.alvarodevicente.b2borders.order.OrderDtos.OrderResponse;
import dev.alvarodevicente.b2borders.order.OrderDtos.OrderSummaryResponse;
import dev.alvarodevicente.b2borders.product.Product;
import dev.alvarodevicente.b2borders.product.ProductRepository;
import dev.alvarodevicente.b2borders.user.AppUserRepository;
import dev.alvarodevicente.b2borders.user.Role;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates the order use cases: load data, check who may do what, check licenses, then delegate
 * the state change to the Order entity. Every public method is one transaction: all or nothing.
 */
@Service
public class OrderService {

    private final OrderRepository orders;
    private final ProductRepository products;
    private final AppUserRepository users;
    private final CustomerService customerService;
    private final LicenseService licenseService;
    private final Clock clock;

    public OrderService(OrderRepository orders, ProductRepository products, AppUserRepository users,
                        CustomerService customerService, LicenseService licenseService, Clock clock) {
        this.orders = orders;
        this.products = products;
        this.users = users;
        this.customerService = customerService;
        this.licenseService = licenseService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> search(OrderStatus status, Long customerId, Pageable pageable,
                                                     CurrentUser current) {
        List<Specification<Order>> filters = new ArrayList<>();
        filters.add(OrderSpecifications.visibleTo(current));
        if (status != null) {
            filters.add(OrderSpecifications.hasStatus(status));
        }
        if (customerId != null) {
            filters.add(OrderSpecifications.hasCustomer(customerId));
        }
        return PageResponse.of(orders.findAll(Specification.allOf(filters), pageable), OrderSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id, CurrentUser current) {
        return toResponse(getAccessible(id, current), current);
    }

    @Transactional
    public OrderResponse createDraft(CreateOrderRequest request, CurrentUser current) {
        Long customerId = current.role() == Role.CUSTOMER ? current.customerId() : request.customerId();
        if (customerId == null) {
            throw new BusinessRuleException("Indica el cliente del pedido");
        }
        Customer customer = customerService.getAccessible(customerId, current);
        if (!customer.isActive()) {
            throw new BusinessRuleException("El cliente " + customer.getName() + " está dado de baja");
        }
        Instant now = clock.instant();
        Order order = new Order(customer, users.getReferenceById(current.id()), now);
        order.replaceLines(resolveLines(customer, request.lines()), now);
        orders.save(order);
        return toResponse(order, current);
    }

    @Transactional
    public OrderResponse replaceLines(Long id, List<OrderLineRequest> lines, CurrentUser current) {
        Order order = getAccessible(id, current);
        order.replaceLines(resolveLines(order.getCustomer(), lines), clock.instant());
        return toResponse(order, current);
    }

    @Transactional
    public OrderResponse confirm(Long id, CurrentUser current) {
        lockProductsOf(id);
        Order order = getAccessible(id, current);
        // Things may have changed since the draft was created: the customer was deactivated,
        // a product withdrawn or a license expired.
        if (!order.getCustomer().isActive()) {
            throw new BusinessRuleException("El cliente " + order.getCustomer().getName() + " está dado de baja");
        }
        List<Product> orderedProducts = order.getLines().stream().map(OrderLine::getProduct).toList();
        orderedProducts.stream().filter(product -> !product.isActive()).findFirst().ifPresent(product -> {
            throw new BusinessRuleException("El producto " + product.getSku() + " ya no está a la venta");
        });
        checkLicenses(order.getCustomer(), orderedProducts);
        order.confirm(clock.instant());
        return toResponse(order, current);
    }

    @Transactional
    public OrderResponse cancel(Long id, CurrentUser current) {
        lockProductsOf(id);
        Order order = getAccessible(id, current);
        if (!current.isStaff() && order.getStatus() != OrderStatus.DRAFT) {
            throw new AccessDeniedException("Un cliente solo puede cancelar pedidos en borrador");
        }
        order.cancel(clock.instant());
        return toResponse(order, current);
    }

    @Transactional
    public OrderResponse ship(Long id, CurrentUser current) {
        Order order = getAccessible(id, current);
        order.ship(clock.instant());
        return toResponse(order, current);
    }

    @Transactional
    public OrderResponse deliver(Long id, CurrentUser current) {
        Order order = getAccessible(id, current);
        order.deliver(clock.instant());
        return toResponse(order, current);
    }

    /** Same rules the endpoints enforce, computed for the client so it can show only valid buttons. */
    static Set<OrderAction> availableActions(Order order, CurrentUser current) {
        Set<OrderAction> actions = EnumSet.noneOf(OrderAction.class);
        switch (order.getStatus()) {
            case DRAFT -> actions.addAll(List.of(OrderAction.EDIT_LINES, OrderAction.CONFIRM, OrderAction.CANCEL));
            case CONFIRMED -> {
                if (current.isStaff()) {
                    actions.addAll(List.of(OrderAction.SHIP, OrderAction.CANCEL));
                }
            }
            case SHIPPED -> {
                if (current.isStaff()) {
                    actions.add(OrderAction.DELIVER);
                }
            }
            case DELIVERED, CANCELLED -> {
                // final states: nothing to do
            }
        }
        return actions;
    }

    /**
     * Confirming and cancelling change stock. The products are locked (SELECT ... FOR UPDATE) BEFORE the
     * order is loaded, so the stock read afterwards is the latest committed value and nobody else can
     * change it until this transaction ends. Concurrent orders for the same product wait in line
     * instead of failing with a version conflict.
     */
    private void lockProductsOf(Long orderId) {
        List<Long> productIds = orders.findProductIds(orderId);
        if (!productIds.isEmpty()) {
            products.lockByIds(productIds);
        }
    }

    private Order getAccessible(Long id, CurrentUser current) {
        return orders.findDetailedById(id)
                .filter(order -> current.canAccess(order.getCustomer()))
                .orElseThrow(() -> new NotFoundException("Pedido", id));
    }

    /** Turns the requested lines into products + quantities, validating everything first. */
    private Map<Product, Integer> resolveLines(Customer customer, List<OrderLineRequest> requested) {
        Set<Long> seen = new HashSet<>();
        for (OrderLineRequest line : requested) {
            if (!seen.add(line.productId())) {
                throw new BusinessRuleException("El producto " + line.productId()
                        + " aparece repetido: junta las cantidades en una sola línea");
            }
        }

        Map<Long, Product> byId = products.findByIdIn(seen).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        Map<Product, Integer> result = new LinkedHashMap<>();
        for (OrderLineRequest line : requested) {
            Product product = byId.get(line.productId());
            if (product == null) {
                throw new NotFoundException("Producto", line.productId());
            }
            if (!product.isActive()) {
                throw new BusinessRuleException("El producto " + product.getSku() + " ya no está a la venta");
            }
            result.put(product, line.quantity());
        }
        checkLicenses(customer, result.keySet());
        return result;
    }

    private void checkLicenses(Customer customer, Iterable<Product> productsToCheck) {
        Set<Long> licensedBrands = licenseService.validBrandIdsToday(customer.getId());
        for (Product product : productsToCheck) {
            if (!licensedBrands.contains(product.getBrand().getId())) {
                throw new BusinessRuleException(customer.getName() + " no tiene licencia en vigor de la marca "
                        + product.getBrand().getName() + " (producto " + product.getSku() + ")");
            }
        }
    }

    private OrderResponse toResponse(Order order, CurrentUser current) {
        return OrderResponse.from(order, availableActions(order, current));
    }
}
