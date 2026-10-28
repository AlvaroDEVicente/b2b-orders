package dev.alvarodevicente.b2borders.customer;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.customer.CustomerDtos.CustomerRequest;
import dev.alvarodevicente.b2borders.customer.CustomerDtos.CustomerResponse;
import dev.alvarodevicente.b2borders.license.LicenseDtos.LicenseResponse;
import dev.alvarodevicente.b2borders.license.LicenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Clientes")
public class CustomerController {

    private final CustomerService customerService;
    private final LicenseService licenseService;

    public CustomerController(CustomerService customerService, LicenseService licenseService) {
        this.customerService = customerService;
        this.licenseService = licenseService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @Operation(summary = "Clientes visibles: todos para ADMIN, los asignados para SALES")
    public List<CustomerResponse> findAll(CurrentUser current) {
        return customerService.findVisible(current);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un cliente (un CUSTOMER solo puede ver el suyo)")
    public CustomerResponse findById(@PathVariable Long id, CurrentUser current) {
        return customerService.findById(id, current);
    }

    @GetMapping("/{id}/licenses")
    @Operation(summary = "Licencias del cliente")
    public List<LicenseResponse> licenses(@PathVariable Long id, CurrentUser current) {
        return licenseService.findByCustomer(id, current);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crea un cliente (solo ADMIN)")
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request) {
        return customerService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifica un cliente (solo ADMIN)")
    public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }
}
