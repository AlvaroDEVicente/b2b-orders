package dev.alvarodevicente.b2borders.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Usuarios")
public class UserController {

    private final AppUserRepository users;

    public UserController(AppUserRepository users) {
        this.users = users;
    }

    @GetMapping("/sales-reps")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    @Operation(summary = "Comerciales disponibles para asignar a un cliente (solo ADMIN)")
    public List<SalesRepResponse> salesReps() {
        return users.findByRoleAndActiveTrueOrderByFullNameAsc(Role.SALES).stream()
                .map(u -> new SalesRepResponse(u.getId(), u.getFullName(), u.getEmail()))
                .toList();
    }

    public record SalesRepResponse(Long id, String fullName, String email) {
    }
}
