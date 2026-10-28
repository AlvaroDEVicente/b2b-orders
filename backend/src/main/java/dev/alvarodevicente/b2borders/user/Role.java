package dev.alvarodevicente.b2borders.user;

/**
 * ADMIN: manages the catalog, customers and licenses, and sees everything.
 * SALES: works with the customers assigned to them.
 * CUSTOMER: a person at a distributor company; only sees their own company's data.
 */
public enum Role {
    ADMIN,
    SALES,
    CUSTOMER
}
