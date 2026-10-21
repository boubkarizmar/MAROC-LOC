package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AuthResponse;
import com.marocloc.marocloc_backend.dto.LoginRequest;
import com.marocloc.marocloc_backend.dto.RegisterRequest;
import com.marocloc.marocloc_backend.dto.RefreshTokenRequest;
import com.marocloc.marocloc_backend.exception.UserAlreadyExistsException;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.security.JwtUtil;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;

/**
 * Implementation of authentication service
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;
    private final NotificationService notificationService;

    private static final Set<String> DISPOSABLE_EMAIL_DOMAINS = Set.of(
            "mailinator.com",
            "10minutemail.com",
            "tempmail.com",
            "trashmail.com",
            "dispostable.com",
            "yopmail.com",
            "guerrillamail.com",
            "maildrop.cc",
            "fakeinbox.com"
    );

    private static final Set<String> ALLOWED_CITIES = Set.of(
            "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra",
            "Tetouan", "Safi", "El Jadida", "Nador", "Khenifra", "Berrechid", "Taza", "Settat",
            "Khouribga", "Beni Mellal", "Larache", "Inezgane", "Ouarzazate", "Tata", "Tan-Tan"
    );

    private static final String NAME_PATTERN = "^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$";
    private static final String CITY_PATTERN = "^[A-Za-zÀ-ÖØ-öø-ÿ ]{2,80}$";
    private static final String PHONE_PATTERN = "^(?:\\+212|0)(?:6|7)\\d{8}$";
    private static final String PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&*!?&]).{8,}$";
    private static final String EMAIL_PATTERN = "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*$";
    private static final String FULL_NAME_PATTERN = "^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*(?: [A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*)+$";

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        validateRequest(request);

        if (userRepository.existsByEmail(request.getEmail().toLowerCase(Locale.ROOT))) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        try {
            // Build user with all required fields properly initialized
            User user = User.builder()
                    .name(request.getFullName())
                    .email(request.getEmail().toLowerCase(Locale.ROOT))
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(request.getRole())
                    .firstNameLatin(request.getFirstName())
                    .lastNameLatin(request.getLastName())
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhone())
                    .city(request.getCity())
                    .isVerified(false) // Explicitly set default value
                    .createdAt(LocalDateTime.now()) // Explicitly set timestamp
                    .build();

            // Save user first
            User savedUser = userRepository.save(user);

            // Generate token pair with proper role claim
            var userDetails = new org.springframework.security.core.userdetails.User(
                    savedUser.getEmail(),
                    savedUser.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + savedUser.getRole().name()))
            );

            // Generate tokens
            var tokens = jwtUtil.generateTokenPair(userDetails);

            // Create refresh token - this must succeed or the whole transaction rolls back
            refreshTokenService.createRefreshToken(savedUser, tokens.get("refreshToken"));

            // Create welcome notification
            notificationService.createFromTemplate(NotificationTemplate.accountCreated(savedUser.getId()));

            // Audit successful registration
            auditService.logAuthenticationEvent("REGISTRATION_SUCCESS", savedUser.getEmail(), "unknown", true, "User registered successfully");
            auditService.logTokenEvent("ACCESS_TOKEN_ISSUED", savedUser.getEmail(), "access", true);
            auditService.logTokenEvent("REFRESH_TOKEN_ISSUED", savedUser.getEmail(), "refresh", true);

            return AuthResponse.builder()
                    .accessToken(tokens.get("accessToken"))
                    .refreshToken(tokens.get("refreshToken"))
                    .tokenType("Bearer")
                    .expiresIn(jwtUtil.getAccessTokenExpiration() / 1000)
                    .refreshExpiresIn(jwtUtil.getRefreshTokenExpiration() / 1000)
                    .userId(savedUser.getId())
                    .name(savedUser.getName())
                    .email(savedUser.getEmail())
                    .role(savedUser.getRole().name())
                    .build();

        } catch (Exception e) {
            // Audit failed registration
            auditService.logAuthenticationEvent("REGISTRATION_FAILED", request.getEmail(), "unknown", false, e.getMessage());
            throw new RuntimeException("Registration failed: " + e.getMessage(), e);
        }
    }

    private static final String XSS_PATTERN = "<[^>]*>|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=";
    private static final String SQL_INJECTION_PATTERN = "('|(\\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\\b))";

    private void validateRequest(RegisterRequest request) {
        // Basic validation
        if (request.getFirstName() == null || request.getFirstName().trim().length() < 2
                || !request.getFirstName().trim().matches(NAME_PATTERN)) {
            throw new IllegalArgumentException("First name must be at least 2 letters and contain only letters, spaces, apostrophes or hyphens.");
        }

        if (request.getLastName() == null || request.getLastName().trim().length() < 2
                || !request.getLastName().trim().matches(NAME_PATTERN)) {
            throw new IllegalArgumentException("Last name must be at least 2 letters and contain only letters, spaces, apostrophes or hyphens.");
        }

        if (request.getFullName() == null || request.getFullName().trim().length() < 5
                || !request.getFullName().trim().matches(FULL_NAME_PATTERN)) {
            throw new IllegalArgumentException("Full name must contain first and last name and may include spaces, apostrophes or hyphens.");
        }

        // XSS and injection prevention
        if (containsXssOrInjection(request.getFirstName()) || containsXssOrInjection(request.getLastName()) ||
            containsXssOrInjection(request.getFullName()) || containsXssOrInjection(request.getCity())) {
            throw new IllegalArgumentException("Input contains potentially malicious content.");
        }

        String lowercaseFullName = request.getFullName().trim().toLowerCase(Locale.ROOT);
        if (!lowercaseFullName.contains(request.getFirstName().trim().toLowerCase(Locale.ROOT))
                || !lowercaseFullName.contains(request.getLastName().trim().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Full name must include both first name and last name.");
        }

        if (request.getCity() == null || request.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("City is required.");
        }

        String normalizedCity = request.getCity().trim();
        if (!ALLOWED_CITIES.contains(normalizedCity)
                && !normalizedCity.matches(CITY_PATTERN)) {
            throw new IllegalArgumentException("City must be a valid Moroccan city or a valid custom city name.");
        }

        if (request.getPhone() == null || !request.getPhone().matches(PHONE_PATTERN)) {
            throw new IllegalArgumentException("Phone must be a valid Moroccan number like +2126XXXXXXXX or 06XXXXXXXX.");
        }

        if (request.getEmail() == null || !request.getEmail().matches(EMAIL_PATTERN)) {
            throw new IllegalArgumentException("Invalid email format.");
        }

        String domain = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (domain.contains("@")) {
            domain = domain.substring(domain.indexOf('@') + 1);
        }

        if (DISPOSABLE_EMAIL_DOMAINS.contains(domain)) {
            throw new IllegalArgumentException("Disposable email addresses are not allowed.");
        }

        if (request.getPassword() == null || !request.getPassword().matches(PASSWORD_PATTERN)) {
            throw new IllegalArgumentException("Password must include uppercase, lowercase, a number, and a special character.");
        }

        if (request.getRole() == null || (request.getRole() != Role.LOCATAIRE && request.getRole() != Role.PROPRIETAIRE)) {
            throw new IllegalArgumentException("Invalid user type. Choose locataire or propriétaire.");
        }
    }

    /**
     * Check for XSS attacks and SQL injection attempts
     */
    private boolean containsXssOrInjection(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase(Locale.ROOT);
        return lowerInput.matches(".*" + XSS_PATTERN + ".*") ||
               lowerInput.matches(".*" + SQL_INJECTION_PATTERN + ".*");
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate user
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // Load user details
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate token pair with role claim
            var userDetails = new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
            var tokens = jwtUtil.generateTokenPair(userDetails);
            refreshTokenService.createRefreshToken(user, tokens.get("refreshToken"));

            // Audit successful login
            auditService.logAuthenticationEvent("LOGIN_SUCCESS", user.getEmail(), "unknown", true, "User logged in successfully");
            auditService.logTokenEvent("ACCESS_TOKEN_ISSUED", user.getEmail(), "access", true);
            auditService.logTokenEvent("REFRESH_TOKEN_ISSUED", user.getEmail(), "refresh", true);

            return AuthResponse.builder()
                    .accessToken(tokens.get("accessToken"))
                    .refreshToken(tokens.get("refreshToken"))
                    .tokenType("Bearer")
                    .expiresIn(jwtUtil.getAccessTokenExpiration() / 1000)
                    .refreshExpiresIn(jwtUtil.getRefreshTokenExpiration() / 1000)
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();

        } catch (Exception e) {
            // Audit failed login
            auditService.logAuthenticationEvent("LOGIN_FAILED", request.getEmail(), "unknown", false, e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        try {
            // Extract username from refresh token
            String username = jwtUtil.extractUsername(request.getRefreshToken());

            // Load user details
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create UserDetails for validation
            var userDetails = new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    java.util.Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );

            // Validate refresh token
            if (!jwtUtil.validateRefreshToken(request.getRefreshToken(), userDetails)) {
                auditService.logAuthenticationEvent("REFRESH_TOKEN_INVALID", username, "unknown", false, "Invalid refresh token");
                throw new org.springframework.security.authentication.BadCredentialsException("Refresh token is invalid or expired");
            }

            // Generate new token pair
            var tokens = jwtUtil.generateTokenPair(userDetails);
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
            refreshTokenService.createRefreshToken(user, tokens.get("refreshToken"));

            // Audit successful token refresh
            auditService.logTokenEvent("ACCESS_TOKEN_REFRESHED", user.getEmail(), "access", true);
            auditService.logTokenEvent("REFRESH_TOKEN_REFRESHED", user.getEmail(), "refresh", true);

            return AuthResponse.builder()
                    .accessToken(tokens.get("accessToken"))
                    .refreshToken(tokens.get("refreshToken"))
                    .tokenType("Bearer")
                    .expiresIn(jwtUtil.getAccessTokenExpiration() / 1000)
                    .refreshExpiresIn(jwtUtil.getRefreshTokenExpiration() / 1000)
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();

        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw e;
        } catch (Exception e) {
            auditService.logAuthenticationEvent("REFRESH_TOKEN_FAILED", "unknown", "unknown", false, e.getMessage());
            throw new RuntimeException("Token refresh failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        String username = jwtUtil.extractUsername(request.getRefreshToken());
        refreshTokenService.revokeRefreshToken(request.getRefreshToken());
        auditService.logAuthenticationEvent("LOGOUT", username, "refresh", true, "User logged out and refresh token revoked");
    }
}