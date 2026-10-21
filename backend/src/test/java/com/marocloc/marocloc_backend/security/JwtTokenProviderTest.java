package com.marocloc.marocloc_backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@DisplayName("JWT Token Provider Tests")
class JwtTokenProviderTest {

    private JwtUtil jwtUtil;
    private JwtTokenProvider tokenProvider;
    private static final String TEST_SECRET = "TestSecretKeyForUnitTestsMustBeAtLeast32Chars";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiration", 60000L);
        ReflectionTestUtils.setField(jwtUtil, "refreshTokenExpiration", 120000L);
        tokenProvider = new JwtTokenProvider(jwtUtil);
    }

    @Test
    @DisplayName("Should validate token successfully")
    void shouldValidateTokenSuccessfully() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);

        assertThat(tokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Should reject invalid token")
    void shouldRejectInvalidToken() {
        assertThat(tokenProvider.validateToken("invalid.token.here")).isFalse();
    }

    @Test
    @DisplayName("Should extract user ID from token")
    void shouldExtractUserIdFromToken() {
        UserDetails userDetails = new User("user@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_LOCATAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);

        String userId = tokenProvider.getUserIdFromToken(token);

        assertThat(userId).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("Should extract roles from token")
    void shouldExtractRolesFromToken() {
        UserDetails userDetails = new User("admin@example.com", "password",
                List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")
                ));
        String token = jwtUtil.generateAccessToken(userDetails);

        String roles = tokenProvider.getRolesFromToken(token);

        assertThat(roles).contains("ROLE_ADMIN");
        assertThat(roles).contains("ROLE_PROPRIETAIRE");
    }

    @Test
    @DisplayName("Should create authentication from token")
    void shouldCreateAuthenticationFromToken() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);

        Authentication auth = tokenProvider.getAuthentication(token);

        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("test@example.com");
        assertThat(auth.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_PROPRIETAIRE");
    }
}
