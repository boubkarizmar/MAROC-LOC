package com.marocloc.marocloc_backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI / Swagger configuration for MAROC-LOC API documentation.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Bean
    public OpenAPI maroclocOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("MAROC-LOC API")
                        .description("Plateforme immobilière intelligente marocaine - API Documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("MAROC-LOC Team")
                                .email("support@marocloc.ma")
                                .url("https://marocloc.ma"))
                        .license(new License()
                                .name("Propriétaire")
                                .url("https://marocloc.ma/terms")))
                .servers(List.of(
                        new Server().url("http://localhost:8080" + contextPath).description("Local development"),
                        new Server().url("https://api.marocloc.ma" + contextPath).description("Production")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
