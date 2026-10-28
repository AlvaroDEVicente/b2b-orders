package dev.alvarodevicente.b2borders.license;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import dev.alvarodevicente.b2borders.license.LicenseDtos.LicenseRequest;
import dev.alvarodevicente.b2borders.license.LicenseDtos.LicenseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/licenses")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Licencias")
public class LicenseController {

    private final LicenseService licenseService;

    public LicenseController(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Concede una licencia de marca a un cliente (solo ADMIN)")
    public LicenseResponse create(@Valid @RequestBody LicenseRequest request, CurrentUser current) {
        return licenseService.create(request, current);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Elimina una licencia (solo ADMIN)")
    public void delete(@PathVariable Long id) {
        licenseService.delete(id);
    }
}
