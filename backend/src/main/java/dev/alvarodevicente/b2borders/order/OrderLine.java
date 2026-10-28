package dev.alvarodevicente.b2borders.order;

import dev.alvarodevicente.b2borders.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "order_line")
public class OrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    /**
     * Price copied from the product when the line is created or edited. Once the order is confirmed the
     * lines can no longer change, so later catalog price changes never alter a past order.
     */
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    protected OrderLine() {
        // required by JPA
    }

    OrderLine(Order order, Product product, int quantity) {
        this.order = order;
        this.product = product;
        changeQuantity(quantity);
    }

    /** Package-private: only Order may change its lines, and only while it is a draft. */
    void changeQuantity(int newQuantity) {
        this.quantity = newQuantity;
        this.unitPrice = product.getUnitPrice();
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(newQuantity));
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }
}
