package dev.alvarodevicente.b2borders.brand;

import dev.alvarodevicente.b2borders.brand.BrandDtos.BrandRequest;
import dev.alvarodevicente.b2borders.brand.BrandDtos.BrandResponse;
import dev.alvarodevicente.b2borders.common.ConflictException;
import dev.alvarodevicente.b2borders.common.NotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BrandService {

    private final BrandRepository brands;

    public BrandService(BrandRepository brands) {
        this.brands = brands;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> findAll() {
        return brands.findAllByOrderByNameAsc().stream().map(BrandResponse::from).toList();
    }

    @Transactional
    public BrandResponse create(BrandRequest request) {
        String name = request.name().trim();
        if (brands.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Ya existe una marca llamada " + name);
        }
        return BrandResponse.from(brands.save(new Brand(name, request.royaltyRate())));
    }

    @Transactional
    public BrandResponse update(Long id, BrandRequest request) {
        Brand brand = getEntity(id);
        String name = request.name().trim();
        if (brands.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Ya existe una marca llamada " + name);
        }
        boolean active = request.active() == null ? brand.isActive() : request.active();
        // No save() call needed: the entity is managed, Hibernate writes the changes at commit ("dirty checking").
        brand.update(name, request.royaltyRate(), active);
        return BrandResponse.from(brand);
    }

    public Brand getEntity(Long id) {
        return brands.findById(id).orElseThrow(() -> new NotFoundException("Marca", id));
    }
}
