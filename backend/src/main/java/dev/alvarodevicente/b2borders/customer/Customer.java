package dev.alvarodevicente.b2borders.customer;

import dev.alvarodevicente.b2borders.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A distributor company that buys licensed products. */
@Entity
@Table(name = "customer")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** Spanish CIF/NIF. */
    @Column(name = "tax_id", nullable = false, unique = true)
    private String taxId;

    @Column(nullable = false)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String city;

    /** LAZY: the sales rep is only loaded when the code actually reads it. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_rep_id")
    private AppUser salesRep;

    @Column(nullable = false)
    private boolean active = true;

    protected Customer() {
        // required by JPA
    }

    public Customer(String name, String taxId, String email, String phone, String city, AppUser salesRep) {
        update(name, taxId, email, phone, city, salesRep, true);
    }

    public void update(String name, String taxId, String email, String phone, String city,
                       AppUser salesRep, boolean active) {
        this.name = name;
        this.taxId = taxId;
        this.email = email;
        this.phone = phone;
        this.city = city;
        this.salesRep = salesRep;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getTaxId() {
        return taxId;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getCity() {
        return city;
    }

    public AppUser getSalesRep() {
        return salesRep;
    }

    public boolean isActive() {
        return active;
    }
}
