package dev.alvarodevicente.b2borders.order;

import dev.alvarodevicente.b2borders.common.ConflictException;
import dev.alvarodevicente.b2borders.customer.Customer;
import dev.alvarodevicente.b2borders.product.Product;
import dev.alvarodevicente.b2borders.user.AppUser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "orders") // "order" is a reserved word in SQL
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.DRAFT;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderLine> lines = new ArrayList<>();

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    protected Order() {
    }

    public Order(Customer customer, AppUser createdBy, Instant now) {
        this.customer = customer;
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    // Updates existing lines instead of delete + insert: Hibernate flushes INSERTs before DELETEs,
    // so re-adding the same product would break UNIQUE (order_id, product_id)
    public void replaceLines(Map<Product, Integer> quantities, Instant now) {
        requireStatus(OrderStatus.DRAFT, "modificar las líneas");
        Map<Long, Integer> byProductId = new LinkedHashMap<>();
        quantities.forEach((product, quantity) -> byProductId.put(product.getId(), quantity));

        lines.removeIf(line -> !byProductId.containsKey(line.getProduct().getId()));
        quantities.forEach((product, quantity) -> lines.stream()
                .filter(line -> line.getProduct().getId().equals(product.getId()))
                .findFirst()
                .ifPresentOrElse(line -> line.changeQuantity(quantity),
                        () -> lines.add(new OrderLine(this, product, quantity))));

        total = lines.stream().map(OrderLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        updatedAt = now;
    }

    public void confirm(Instant now) {
        if (!status.canTransitionTo(OrderStatus.CONFIRMED)) {
            throw new ConflictException("Un pedido en estado " + status + " no puede pasar a CONFIRMED");
        }
        lines.forEach(line -> line.getProduct().checkStock(line.getQuantity()));
        lines.forEach(line -> line.getProduct().takeStock(line.getQuantity()));
        moveTo(OrderStatus.CONFIRMED, now);
        confirmedAt = now;
    }

    public void cancel(Instant now) {
        boolean stockWasTaken = status == OrderStatus.CONFIRMED;
        moveTo(OrderStatus.CANCELLED, now);
        if (stockWasTaken) {
            lines.forEach(line -> line.getProduct().returnStock(line.getQuantity()));
        }
    }

    public void ship(Instant now) {
        moveTo(OrderStatus.SHIPPED, now);
    }

    public void deliver(Instant now) {
        moveTo(OrderStatus.DELIVERED, now);
    }

    private void moveTo(OrderStatus target, Instant now) {
        if (!status.canTransitionTo(target)) {
            throw new ConflictException("Un pedido en estado " + status + " no puede pasar a " + target);
        }
        status = target;
        updatedAt = now;
    }

    private void requireStatus(OrderStatus required, String action) {
        if (status != required) {
            throw new ConflictException("Solo se pueden " + action + " en estado " + required
                    + "; el pedido está en " + status);
        }
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public List<OrderLine> getLines() {
        return Collections.unmodifiableList(lines);
    }

    public BigDecimal getTotal() {
        return total;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
