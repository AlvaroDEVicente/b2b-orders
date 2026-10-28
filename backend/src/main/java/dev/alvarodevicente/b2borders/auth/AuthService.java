package dev.alvarodevicente.b2borders.auth;

import dev.alvarodevicente.b2borders.auth.AuthDtos.LoginRequest;
import dev.alvarodevicente.b2borders.auth.AuthDtos.LoginResponse;
import dev.alvarodevicente.b2borders.auth.AuthDtos.UserResponse;
import dev.alvarodevicente.b2borders.common.InvalidCredentialsException;
import dev.alvarodevicente.b2borders.common.NotFoundException;
import dev.alvarodevicente.b2borders.user.AppUser;
import dev.alvarodevicente.b2borders.user.AppUserRepository;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    // checked when the email doesn't exist, so a wrong email takes as long as a wrong password
    private static final String DUMMY_HASH = "$2a$10$d.BaH7kR7r8q0ez9in5ZrePorr0NHqx37N5e51LxVQnMGckTkIMOi";

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Optional<AppUser> found = users.findByEmailIgnoreCase(request.email().trim());
        String hash = found.map(AppUser::getPasswordHash).orElse(DUMMY_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.password(), hash);

        AppUser user = found
                .filter(u -> passwordMatches && u.isActive())
                .orElseThrow(InvalidCredentialsException::new);

        TokenService.IssuedToken token = tokenService.issue(user);
        return new LoginResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me(CurrentUser current) {
        return users.findById(current.id())
                .map(UserResponse::from)
                .orElseThrow(() -> new NotFoundException("Usuario", current.id()));
    }
}
