package dev.alvarodevicente.b2borders.auth;

import dev.alvarodevicente.b2borders.customer.Customer;
import dev.alvarodevicente.b2borders.user.Role;
import java.util.Objects;
import org.springframework.security.oauth2.jwt.Jwt;

public record CurrentUser(Long id, String email, String fullName, Role role, Long customerId) {

    public static CurrentUser from(Jwt jwt) {
        Object customerClaim = jwt.getClaim(TokenService.CLAIM_CUSTOMER_ID);
        return new CurrentUser(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaimAsString(TokenService.CLAIM_EMAIL),
                jwt.getClaimAsString(TokenService.CLAIM_NAME),
                Role.valueOf(jwt.getClaimAsString(TokenService.CLAIM_ROLE)),
                customerClaim == null ? null : ((Number) customerClaim).longValue());
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public boolean isStaff() {
        return role == Role.ADMIN || role == Role.SALES;
    }

    public boolean canAccess(Customer customer) {
        return switch (role) {
            case ADMIN -> true;
            case SALES -> customer.getSalesRep() != null && Objects.equals(customer.getSalesRep().getId(), id);
            case CUSTOMER -> Objects.equals(customer.getId(), customerId);
        };
    }
}
