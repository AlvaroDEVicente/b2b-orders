package dev.alvarodevicente.b2borders.auth;

import dev.alvarodevicente.b2borders.user.AppUser;
import dev.alvarodevicente.b2borders.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

/** Request and response bodies of the auth endpoints. Records: immutable, with equals/hashCode for free. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "El email es obligatorio") @Email(message = "El email no es válido") String email,
            @NotBlank(message = "La contraseña es obligatoria") String password) {
    }

    public record LoginResponse(String token, Instant expiresAt, UserResponse user) {
    }

    public record UserResponse(Long id, String email, String fullName, Role role, Long customerId) {

        public static UserResponse from(AppUser user) {
            return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(),
                    user.getCustomerId());
        }
    }
}
