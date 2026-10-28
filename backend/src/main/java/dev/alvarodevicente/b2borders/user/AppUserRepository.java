package dev.alvarodevicente.b2borders.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    List<AppUser> findByRoleAndActiveTrueOrderByFullNameAsc(Role role);
}
