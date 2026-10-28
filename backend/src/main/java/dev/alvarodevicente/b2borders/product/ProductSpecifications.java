package dev.alvarodevicente.b2borders.product;

import java.util.Collection;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/** Reusable WHERE conditions for products. Each one is combined only when its filter is present. */
final class ProductSpecifications {

    private ProductSpecifications() {
    }

    static Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    static Specification<Product> hasBrand(Long brandId) {
        return (root, query, cb) -> cb.equal(root.get("brand").get("id"), brandId);
    }

    static Specification<Product> brandIn(Collection<Long> brandIds) {
        return (root, query, cb) -> brandIds.isEmpty()
                ? cb.disjunction() // always false: no licensed brands, no products
                : root.get("brand").get("id").in(brandIds);
    }

    static Specification<Product> matchesText(String text) {
        String pattern = "%" + text.toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("sku")), pattern));
    }
}
