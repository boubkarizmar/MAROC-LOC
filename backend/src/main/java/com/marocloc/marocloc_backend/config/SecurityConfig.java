package com.marocloc.marocloc_backend.config;

import com.marocloc.marocloc_backend.security.JwtFilter;
import com.marocloc.marocloc_backend.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final RateLimitFilter rateLimitFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:5174}")
    private String corsAllowedOrigins;

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Authentification requise\",\"errorCode\":\"AUTH_REQUIRED\"}");
        };
    }

    @Bean
    public org.springframework.security.web.access.AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Acces refuse\",\"errorCode\":\"ACCESS_DENIED\"}");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(corsAllowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(origins.stream().map(String::trim).toList());
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
                .frameOptions(frame -> frame.deny())
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).preload(true).maxAgeInSeconds(31536000))
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint())
                .accessDeniedHandler(accessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                // 🔓 AUTH (context-path = /api)
                .requestMatchers(ApiRoutes.AUTH + "/**").permitAll()

                // 🔓 PROPERTIES PUBLIC READ (après context-path)
                .requestMatchers(HttpMethod.GET, ApiRoutes.PROPERTIES_V2 + "/**").permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.PROPERTIES_V2).permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.PROPERTIES_V2 + "/search").permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.PROPERTIES_V2 + "/cities").permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.PROPERTIES_V2 + "/categories").permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.PROPERTIES_V2 + "/transaction-types").permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.V1 + "/platform/**").permitAll()
                .requestMatchers(HttpMethod.GET, ApiRoutes.RECOMMENDATIONS + "/**").permitAll()

                // 🔓 ADS
                .requestMatchers(HttpMethod.GET, ApiRoutes.ADS + "/**").permitAll()
                .requestMatchers(HttpMethod.POST, ApiRoutes.ADS + "/stripe/webhook").permitAll()

                // 🔓 PAYMENT CALLBACKS (must be public for external providers)
                .requestMatchers(HttpMethod.POST, ApiRoutes.PAYMENTS + "/cmi/callback/**").permitAll()

                // 🔓 CHATBOT & AI
               .requestMatchers(ApiRoutes.AI + "/chat", ApiRoutes.CHATBOT + "/**").permitAll()



                // 🔓 REVIEWS - Public GET + Site reviews public POST
                .requestMatchers(HttpMethod.GET, ApiRoutes.REVIEWS + "/**").permitAll()
                .requestMatchers(HttpMethod.POST, ApiRoutes.REVIEWS_V1 + "/site").permitAll()

                // 🔥 VIDEOS - PUBLIC
                .requestMatchers(ApiRoutes.VIDEOS + "/**").permitAll()
                .requestMatchers(HttpMethod.HEAD, ApiRoutes.VIDEOS + "/**", "/uploads/**", ApiRoutes.PROPERTIES_V2 + "/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // 🔓 HEATMAPS - Public
                .requestMatchers(HttpMethod.GET, "/v1/analytics/heatmap/**").permitAll()

                // 🔓 WEBSOCKET
                .requestMatchers("/ws/**").permitAll()

                // 🔓 HEALTH & DOCS
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**").permitAll()

                // 🏠 RESERVATION / PURCHASE (available to authenticated tenants/admins)
                .requestMatchers(HttpMethod.POST, ApiRoutes.PROPERTIES_V2 + "/*/reserve", ApiRoutes.PROPERTIES_V2 + "/*/buy").hasAnyRole("LOCATAIRE", "PROPRIETAIRE", "ADMIN")

                // 🟡 OWNER + ADMIN
                .requestMatchers(HttpMethod.POST, ApiRoutes.PROPERTIES_V2 + "/**").hasAnyRole("PROPRIETAIRE", "ADMIN")
                .requestMatchers(HttpMethod.PUT, ApiRoutes.PROPERTIES_V2 + "/**").hasAnyRole("PROPRIETAIRE", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, ApiRoutes.PROPERTIES_V2 + "/**").hasAnyRole("PROPRIETAIRE", "ADMIN")
                .requestMatchers(ApiRoutes.PROPERTIES_V2 + "/my-properties").hasAnyRole("PROPRIETAIRE", "ADMIN")

                // 👑 ADMIN
                .requestMatchers(ApiRoutes.ADMIN + "/**").hasRole("ADMIN")
                .requestMatchers(ApiRoutes.PROPERTIES_V2 + "/statistics").hasRole("ADMIN")

                .anyRequest().authenticated()
            );

        return http.build();
    }
}
