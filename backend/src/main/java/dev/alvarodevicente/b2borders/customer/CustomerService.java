package dev.alvarodevicente.b2borders.customer;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.common.BusinessRuleException;
import dev.alvarodevicente.b2borders.common.ConflictException;
import dev.alvarodevicente.b2borders.common.NotFoundException;
import dev.alvarodevicente.b2borders.customer.CustomerDtos.CustomerRequest;
import dev.alvarodevicente.b2borders.customer.CustomerDtos.CustomerResponse;
import dev.alvarodevicente.b2borders.user.AppUser;
import dev.alvarodevicente.b2borders.user.AppUserRepository;
import dev.alvarodevicente.b2borders.user.Role;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private final CustomerRepository customers;
    private final AppUserRepository users;

    public CustomerService(CustomerRepository customers, AppUserRepository users) {
        this.customers = customers;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findVisible(CurrentUser current) {
        List<Customer> result = current.isAdmin()
                ? customers.findAllByOrderByNameAsc()
                : customers.findBySalesRepIdOrderByNameAsc(current.id());
        return result.stream().map(CustomerResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id, CurrentUser current) {
        return CustomerResponse.from(getAccessible(id, current));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        String taxId = request.taxId().toUpperCase(Locale.ROOT);
        if (customers.existsByTaxIdIgnoreCase(taxId)) {
            throw new ConflictException("Ya existe un cliente con el CIF/NIF " + taxId);
        }
        Customer customer = new Customer(request.name().trim(), taxId, request.email().trim(), request.phone(),
                request.city().trim(), resolveSalesRep(request.salesRepId()));
        return CustomerResponse.from(customers.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = customers.findById(id).orElseThrow(() -> new NotFoundException("Cliente", id));
        String taxId = request.taxId().toUpperCase(Locale.ROOT);
        if (customers.existsByTaxIdIgnoreCaseAndIdNot(taxId, id)) {
            throw new ConflictException("Ya existe un cliente con el CIF/NIF " + taxId);
        }
        boolean active = request.active() == null ? customer.isActive() : request.active();
        customer.update(request.name().trim(), taxId, request.email().trim(), request.phone(), request.city().trim(),
                resolveSalesRep(request.salesRepId()), active);
        return CustomerResponse.from(customer);
    }

    // someone else's customer returns 404, not 403, so we don't reveal that it exists
    @Transactional(readOnly = true)
    public Customer getAccessible(Long id, CurrentUser current) {
        return customers.findById(id)
                .filter(current::canAccess)
                .orElseThrow(() -> new NotFoundException("Cliente", id));
    }

    private AppUser resolveSalesRep(Long salesRepId) {
        if (salesRepId == null) {
            return null;
        }
        AppUser rep = users.findById(salesRepId).orElseThrow(() -> new NotFoundException("Comercial", salesRepId));
        if (rep.getRole() != Role.SALES) {
            throw new BusinessRuleException("El usuario " + rep.getEmail() + " no es comercial");
        }
        return rep;
    }
}
