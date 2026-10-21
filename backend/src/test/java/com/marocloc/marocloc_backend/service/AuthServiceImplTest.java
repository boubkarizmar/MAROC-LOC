package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AuthResponse;
import com.marocloc.marocloc_backend.dto.RegisterRequest;
import com.marocloc.marocloc_backend.exception.UserAlreadyExistsException;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuditService auditService;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = RegisterRequest.builder()
                .firstName("Ahmed")
                .lastName("Benani")
                .fullName("Ahmed Benani")
                .email("ahmed@example.com")
                .password("SecurePass123!")
                .phone("+212600000000")
                .city("Casablanca")
                .role(Role.LOCATAIRE)
                .build();
    }

    @Test
    void register_shouldSucceed_whenRequestIsValid() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtUtil.generateTokenPair(any())).thenReturn(Map.of(
                "accessToken", "access-token",
                "refreshToken", "refresh-token"
        ));
        when(jwtUtil.getAccessTokenExpiration()).thenReturn(900000L);
        when(jwtUtil.getRefreshTokenExpiration()).thenReturn(604800000L);

        AuthResponse response = authService.register(validRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getEmail()).isEqualTo("ahmed@example.com");
        assertThat(response.getRole()).isEqualTo("LOCATAIRE");
        verify(userRepository).save(any(User.class));
        verify(refreshTokenService).createRefreshToken(any(User.class), eq("refresh-token"));
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("ahmed@example.com");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenFirstNameTooShort() {
        validRequest.setFirstName("A");

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("First name");
    }

    @Test
    void register_shouldThrow_whenFullNameDoesNotContainFirstAndLast() {
        validRequest.setFullName("Random Name");

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Full name must include both");
    }
}
