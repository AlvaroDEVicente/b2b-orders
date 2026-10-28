package dev.alvarodevicente.b2borders.config;

import dev.alvarodevicente.b2borders.auth.CurrentUserArgumentResolver;
import java.time.Clock;
import java.time.ZoneId;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class AppConfig implements WebMvcConfigurer {

    public static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Madrid");

    // inject Clock instead of calling now() so tests can freeze time
    @Bean
    Clock clock() {
        return Clock.system(BUSINESS_ZONE);
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentUserArgumentResolver());
    }

    @Bean
    CorsSettings corsSettings(@Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        return new CorsSettings(allowedOrigins);
    }

    public record CorsSettings(List<String> allowedOrigins) {
    }
}
