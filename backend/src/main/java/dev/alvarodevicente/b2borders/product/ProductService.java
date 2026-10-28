package dev.alvarodevicente.b2borders.product;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.brand.Brand;
import dev.alvarodevicente.b2borders.brand.BrandService;
import dev.alvarodevicente.b2borders.common.ConflictException;
import dev.alvarodevicente.b2borders.common.NotFoundException;
import dev.alvarodevicente.b2borders.common.PageResponse;
import dev.alvarodevicente.b2borders.license.LicenseService;
import dev.alvarodevicente.b2borders.product.ProductDtos.ProductRequest;
import dev.alvarodevicente.b2borders.product.ProductDtos.ProductResponse;
import dev.alvarodevicente.b2borders.user.Role;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ProductService {

    private final ProductRepository products;
    private final BrandService brandService;
    private final LicenseService licenseService;

    public ProductService(ProductRepository products, BrandService brandService, LicenseService licenseService) {
        this.products = products;
        this.brandService = brandService;
        this.licenseService = licenseService;
    }

    /**
     * Catalog search. A CUSTOMER only sees products of brands they hold a valid license for, so the
     * catalog never offers something they will not be allowed to order.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(Long brandId, String text, boolean includeInactive,
                                                Pageable pageable, CurrentUser current) {
        List<Specification<Product>> filters = new ArrayList<>();
        if (!(includeInactive && current.isAdmin())) {
            filters.add(ProductSpecifications.isActive());
        }
        if (brandId != null) {
            filters.add(ProductSpecifications.hasBrand(brandId));
        }
        if (StringUtils.hasText(text)) {
            filters.add(ProductSpecifications.matchesText(text.trim()));
        }
        if (current.role() == Role.CUSTOMER) {
            filters.add(ProductSpecifications.brandIn(licenseService.validBrandIdsToday(current.customerId())));
        }
        return PageResponse.of(products.findAll(Specification.allOf(filters), pageable), ProductResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return ProductResponse.from(getEntity(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        String sku = request.sku().trim().toUpperCase(Locale.ROOT);
        if (products.existsBySkuIgnoreCase(sku)) {
            throw new ConflictException("Ya existe un producto con el SKU " + sku);
        }
        Brand brand = brandService.getEntity(request.brandId());
        Product product = new Product(sku, request.name().trim(), brand, request.unitPrice(), request.stock());
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getEntity(id);
        String sku = request.sku().trim().toUpperCase(Locale.ROOT);
        if (products.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new ConflictException("Ya existe un producto con el SKU " + sku);
        }
        Brand brand = brandService.getEntity(request.brandId());
        boolean active = request.active() == null ? product.isActive() : request.active();
        product.update(sku, request.name().trim(), brand, request.unitPrice(), request.stock(), active);
        return ProductResponse.from(product);
    }

    private Product getEntity(Long id) {
        return products.findById(id).orElseThrow(() -> new NotFoundException("Producto", id));
    }
}
