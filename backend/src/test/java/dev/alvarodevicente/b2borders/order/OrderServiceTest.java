package dev.alvarodevicente.b2borders.order;

import static dev.alvarodevicente.b2borders.support.TestData.brand;
import static dev.alvarodevicente.b2borders.support.TestData.customer;
import static dev.alvarodevicente.b2borders.support.TestData.product;
import static dev.alvarodevicente.b2borders.support.TestData.user;
import static dev.alvarodevicente.b2borders.support.TestData.withId;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.brand.Brand;
import dev.alvarodevicente.b2borders.common.BusinessRuleException;
import dev.alvarodevicente.b2borders.customer.Customer;
import dev.alvarodevicente.b2borders.customer.CustomerService;
import dev.alvarodevicente.b2borders.license.LicenseService;
import dev.alvarodevicente.b2borders.order.OrderDtos.CreateOrderRequest;
import dev.alvarodevicente.b2borders.order.OrderDtos.OrderLineRequest;
import dev.alvarodevicente.b2borders.product.Product;
import dev.alvarodevicente.b2borders.product.ProductRepository;
import dev.alvarodevicente.b2borders.user.AppUser;
import dev.alvarodevicente.b2borders.user.AppUserRepository;
import dev.alvarodevicente.b2borders.user.Role;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-28T10:00:00Z");

    @Mock
    private OrderRepository orders;
    @Mock
    private ProductRepository products;
    @Mock
    private AppUserRepository users;
    @Mock
    private CustomerService customerService;
    @Mock
    private LicenseService licenseService;

    private OrderService service;

    private Brand kraken;
    private Brand aurora;
    private AppUser salesRep;
    private Customer customer;
    private CurrentUser customerUser;
    private CurrentUser salesUser;

    @BeforeEach
    void setUp() {
        service = new OrderService(orders, products, users, customerService, licenseService,
                Clock.fixed(NOW, ZoneId.of("Europe/Madrid")));
        kraken = brand(1, "Kraken Sports", "12.00");
        aurora = brand(2, "Aurora Studio", "8.50");
        salesRep = user(2, Role.SALES, null);
        customer = customer(1, salesRep);
        customerUser = new CurrentUser(4L, "cliente@example.com", "Cliente", Role.CUSTOMER, 1L);
        salesUser = new CurrentUser(2L, "comercial@example.com", "Comercial", Role.SALES, null);
    }

    @Test
    void aCustomerAlwaysOrdersForTheirOwnCompany() {
        Product product = product(10, kraken, "9.90", 50);
        when(customerService.getAccessible(1L, customerUser)).thenReturn(customer);
        when(products.findByIdIn(Set.of(10L))).thenReturn(List.of(product));
        when(licenseService.validBrandIdsToday(1L)).thenReturn(Set.of(1L));
        when(users.getReferenceById(4L)).thenReturn(user(4, Role.CUSTOMER, 1L));

        var response = service.createDraft(new CreateOrderRequest(99L, List.of(line(10, 5))), customerUser);

        verify(customerService).getAccessible(1L, customerUser);
        verify(customerService, never()).getAccessible(eq(99L), any());
        assertThat(response.customerId()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo(OrderStatus.DRAFT);
    }

    @Test
    void rejectsProductsOfBrandsWithoutAValidLicense() {
        Product product = product(10, kraken, "9.90", 50);
        when(customerService.getAccessible(1L, salesUser)).thenReturn(customer);
        when(products.findByIdIn(Set.of(10L))).thenReturn(List.of(product));
        when(licenseService.validBrandIdsToday(1L)).thenReturn(Set.of(2L)); // only Aurora
        when(users.getReferenceById(anyLong())).thenReturn(salesRep);

        assertThatThrownBy(() -> service.createDraft(new CreateOrderRequest(1L, List.of(line(10, 5))), salesUser))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("no tiene licencia en vigor de la marca Kraken Sports");
        verify(orders, never()).save(any());
    }

    @Test
    void rejectsTheSameProductTwice() {
        when(customerService.getAccessible(1L, salesUser)).thenReturn(customer);
        when(users.getReferenceById(anyLong())).thenReturn(salesRep);

        assertThatThrownBy(() -> service.createDraft(
                new CreateOrderRequest(1L, List.of(line(10, 5), line(10, 3))), salesUser))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("aparece repetido");
    }

    @Test
    void confirmingChecksTheLicenseAgain() {
        Order draft = draftWith(product(10, aurora, "11.00", 50), 5);
        when(orders.findDetailedById(7L)).thenReturn(Optional.of(draft));
        when(licenseService.validBrandIdsToday(1L)).thenReturn(Set.of()); // license expired since the draft

        assertThatThrownBy(() -> service.confirm(7L, salesUser))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(draft.getStatus()).isEqualTo(OrderStatus.DRAFT);
    }

    @Test
    void aCustomerCannotCancelAConfirmedOrder() {
        Product product = product(10, aurora, "11.00", 50);
        Order confirmed = draftWith(product, 5);
        confirmed.confirm(NOW);
        when(orders.findDetailedById(7L)).thenReturn(Optional.of(confirmed));

        assertThatThrownBy(() -> service.cancel(7L, customerUser))
                .isInstanceOf(AccessDeniedException.class);
        assertThat(confirmed.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(product.getStock()).isEqualTo(45);
    }

    @Test
    void availableActionsDependOnStatusAndRole() {
        Order confirmed = draftWith(product(10, aurora, "11.00", 50), 5);
        assertThat(OrderService.availableActions(confirmed, customerUser))
                .containsExactlyInAnyOrder(OrderAction.EDIT_LINES, OrderAction.CONFIRM, OrderAction.CANCEL);

        confirmed.confirm(NOW);
        assertThat(OrderService.availableActions(confirmed, customerUser)).isEmpty();
        assertThat(OrderService.availableActions(confirmed, salesUser))
                .containsExactlyInAnyOrder(OrderAction.SHIP, OrderAction.CANCEL);
    }

    private Order draftWith(Product product, int quantity) {
        Order order = withId(new Order(customer, salesRep, NOW), 7);
        order.replaceLines(Map.of(product, quantity), NOW);
        return order;
    }

    private static OrderLineRequest line(long productId, int quantity) {
        return new OrderLineRequest(productId, quantity);
    }
}
