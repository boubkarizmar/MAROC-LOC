package com.marocloc.marocloc_backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JWT Utility Tests")
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String TEST_SECRET = "TestSecretKeyForUnitTestsMustBeAtLeast32Chars";
    private static final long ACCESS_EXPIRATION = 60000L; // 1 minute
    private static final long REFRESH_EXPIRATION = 120000L; // 2 minutes

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiration", ACCESS_EXPIRATION);
        ReflectionTestUtils.setField(jwtUtil, "refreshTokenExpiration", REFRESH_EXPIRATION);
    }

    @Test
    @DisplayName("Should generate valid access token")
    void shouldGenerateValidAccessToken() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));

        String token = jwtUtil.generateAccessToken(userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("test@example.com");
        assertThat(jwtUtil.extractTokenType(token)).isEqualTo("access");
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void shouldGenerateValidRefreshToken() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_LOCATAIRE")));

        String token = jwtUtil.generateRefreshToken(userDetails);

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("test@example.com");
        assertThat(jwtUtil.extractTokenType(token)).isEqualTo("refresh");
    }

    @Test
    @DisplayName("Should validate access token successfully")
    void shouldValidateAccessTokenSuccessfully() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        String token = jwtUtil.generateAccessToken(userDetails);

        boolean isValid = jwtUtil.validateAccessToken(token, userDetails);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() throws InterruptedException {
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiration", 1L); // 1ms
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);

        Thread.sleep(50); // Wait for expiration

        boolean isValid = jwtUtil.validateAccessToken(token, userDetails);
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should reject token with wrong username")
    void shouldRejectTokenWithWrongUsername() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);

        UserDetails otherUser = new User("other@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));

        boolean isValid = jwtUtil.validateAccessToken(token, otherUser);
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should detect token near expiration")
    void shouldDetectTokenNearExpiration() {
        // Token with 4 minutes expiration is near the 5-minute threshold
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiration", 240000L); // 4 min
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);

        assertThat(jwtUtil.isTokenNearExpiration(token)).isTrue();
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

        var claims = jwtUtil.extractAllClaims(token);
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);

        assertThat(roles).containsExactly("ROLE_ADMIN", "ROLE_PROPRIETAIRE");
    }

    @Test
    @DisplayName("Should reject tampered token")
    void shouldRejectTamperedToken() {
        UserDetails userDetails = new User("test@example.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_PROPRIETAIRE")));
        String token = jwtUtil.generateAccessToken(userDetails);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThatThrownBy(() -> jwtUtil.extractUsername(tampered))
                .isInstanceOf(Exception.class);
    }
}
