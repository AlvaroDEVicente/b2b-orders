package dev.alvarodevicente.b2borders.license;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.brand.Brand;
import dev.alvarodevicente.b2borders.brand.BrandService;
import dev.alvarodevicente.b2borders.common.ConflictException;
import dev.alvarodevicente.b2borders.common.NotFoundException;
import dev.alvarodevicente.b2borders.customer.Customer;
import dev.alvarodevicente.b2borders.customer.CustomerService;
import dev.alvarodevicente.b2borders.license.LicenseDtos.LicenseRequest;
import dev.alvarodevicente.b2borders.license.LicenseDtos.LicenseResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LicenseService {

    private final LicenseRepository licenses;
    private final CustomerService customerService;
    private final BrandService brandService;
    private final Clock clock;

    public LicenseService(LicenseRepository licenses, CustomerService customerService, BrandService brandService,
                          Clock clock) {
        this.licenses = licenses;
        this.customerService = customerService;
        this.brandService = brandService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<LicenseResponse> findByCustomer(Long customerId, CurrentUser current) {
        customerService.getAccessible(customerId, current);
        LocalDate today = LocalDate.now(clock);
        return licenses.findByCustomerIdOrderByStartDateDesc(customerId).stream()
                .map(license -> LicenseResponse.from(license, today))
                .toList();
    }

    @Transactional
    public LicenseResponse create(LicenseRequest request, CurrentUser current) {
        Customer customer = customerService.getAccessible(request.customerId(), current);
        Brand brand = brandService.getEntity(request.brandId());
        if (licenses.existsOverlapping(customer.getId(), brand.getId(), request.startDate(), request.endDate())) {
            throw new ConflictException("Ya hay una licencia de " + brand.getName() + " para " + customer.getName()
                    + " que se solapa con esas fechas");
        }
        License saved = licenses.save(new License(customer, brand, request.startDate(), request.endDate()));
        return LicenseResponse.from(saved, LocalDate.now(clock));
    }

    @Transactional
    public void delete(Long id) {
        License license = licenses.findById(id).orElseThrow(() -> new NotFoundException("Licencia", id));
        licenses.delete(license);
    }

    @Transactional(readOnly = true)
    public Set<Long> validBrandIdsToday(Long customerId) {
        return licenses.findValidBrandIds(customerId, LocalDate.now(clock));
    }
}
