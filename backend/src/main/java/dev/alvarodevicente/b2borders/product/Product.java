package dev.alvarodevicente.b2borders.product;

import dev.alvarodevicente.b2borders.brand.Brand;
import dev.alvarodevicente.b2borders.common.ConflictException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;

@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int stock;

    @Column(nullable = false)
    private boolean active = true;

    /**
     * Optimistic locking: Hibernate adds "WHERE version = ?" to every UPDATE. If two orders take stock
     * from the same product at the same time, the second update finds a different version and fails
     * instead of silently overwriting the first one.
     */
    @Version
    private long version;

    protected Product() {
        // required by JPA
    }

    public Product(String sku, String name, Brand brand, BigDecimal unitPrice, int stock) {
        update(sku, name, brand, unitPrice, stock, true);
    }

    public void update(String sku, String name, Brand brand, BigDecimal unitPrice, int stock, boolean active) {
        this.sku = sku;
        this.name = name;
        this.brand = brand;
        this.unitPrice = unitPrice;
        this.stock = stock;
        this.active = active;
    }

    public void checkStock(int quantity) {
        if (quantity > stock) {
            throw new ConflictException(
                    "Stock insuficiente para " + sku + ": quedan " + stock + " y se piden " + quantity);
        }
    }

    public void takeStock(int quantity) {
        checkStock(quantity);
        stock -= quantity;
    }

    public void returnStock(int quantity) {
        stock += quantity;
    }

    public Long getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public Brand getBrand() {
        return brand;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public int getStock() {
        return stock;
    }

    public boolean isActive() {
        return active;
    }
}
