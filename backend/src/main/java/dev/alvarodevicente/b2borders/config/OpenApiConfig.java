package dev.alvarodevicente.b2borders.config;

import dev.alvarodevicente.b2borders.auth.CurrentUser;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI at /swagger-ui.html. "Authorize" asks for the JWT once and sends it on every call.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "B2B Orders API", version = "1.0",
                description = "Pedidos B2B, catálogo, licencias de marca y royalties"),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {

    static {
        // CurrentUser is filled in from the token, not sent by the client: hide it from the docs.
        SpringDocUtils.getConfig().addRequestWrapperToIgnore(CurrentUser.class);
    }
}
