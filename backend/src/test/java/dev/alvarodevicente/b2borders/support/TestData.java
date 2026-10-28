package dev.alvarodevicente.b2borders.support;

import dev.alvarodevicente.b2borders.brand.Brand;
import dev.alvarodevicente.b2borders.customer.Customer;
import dev.alvarodevicente.b2borders.product.Product;
import dev.alvarodevicente.b2borders.user.AppUser;
import dev.alvarodevicente.b2borders.user.Role;
import java.math.BigDecimal;
import org.springframework.test.util.ReflectionTestUtils;

public final class TestData {

    private TestData() {
    }

    public static Brand brand(long id, String name, String royaltyRate) {
        return withId(new Brand(name, new BigDecimal(royaltyRate)), id);
    }

    public static Product product(long id, Brand brand, String price, int stock) {
        return withId(new Product("SKU-" + id, "Producto " + id, brand, new BigDecimal(price), stock), id);
    }

    public static AppUser user(long id, Role role, Long customerId) {
        return withId(new AppUser("user" + id + "@example.com", "hash", "Usuario " + id, role, customerId), id);
    }

    public static Customer customer(long id, AppUser salesRep) {
        return withId(new Customer("Cliente " + id, "B0000000" + id, "c" + id + "@example.com", null, "Bilbao",
                salesRep), id);
    }

    public static <T> T withId(T entity, long id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }
}
