package dev.alvarodevicente.b2borders.brand;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "brand")
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "royalty_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal royaltyRate;

    @Column(nullable = false)
    private boolean active = true;

    protected Brand() {
    }

    public Brand(String name, BigDecimal royaltyRate) {
        update(name, royaltyRate, true);
    }

    public void update(String name, BigDecimal royaltyRate, boolean active) {
        this.name = name;
        this.royaltyRate = royaltyRate;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getRoyaltyRate() {
        return royaltyRate;
    }

    public boolean isActive() {
        return active;
    }
}
