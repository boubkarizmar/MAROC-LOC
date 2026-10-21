package com.marocloc.marocloc_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marocloc.marocloc_backend.dto.AuthResponse;
import com.marocloc.marocloc_backend.dto.LoginRequest;
import com.marocloc.marocloc_backend.dto.RegisterRequest;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.marocloc.marocloc_backend.AbstractIntegrationTest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Auth Controller Security Tests")
class AuthControllerSecurityTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private AuthenticationProvider authenticationProvider;



    @Test
    @DisplayName("Should allow public access to login endpoint")
    void shouldAllowPublicAccessToLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        when(authService.login(any())).thenReturn(AuthResponse.builder()
                .accessToken("test-token")
                .refreshToken("refresh-token")
                .tokenType("Bearer")
                .role("LOCATAIRE")
                .build());

        mockMvc.perform(post("/api/v1/auth/login").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should allow public access to register endpoint")
    void shouldAllowPublicAccessToRegister() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setPassword("SecurePass123!");
        request.setFullName("Test User");
        request.setFirstName("Test");
        request.setLastName("User");
        request.setCity("Casablanca");
        request.setPhone("+212612345678");
        request.setRole(com.marocloc.marocloc_backend.model.Role.LOCATAIRE);

        when(authService.register(any())).thenReturn(AuthResponse.builder()
                .accessToken("test-token")
                .tokenType("Bearer")
                .role("LOCATAIRE")
                .build());

        mockMvc.perform(post("/api/v1/auth/register").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should reject login with invalid email format")
    void shouldRejectLoginWithInvalidEmail() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("invalid-email");
        request.setPassword("password123");

        mockMvc.perform(post("/api/v1/auth/login").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject login with short password")
    void shouldRejectLoginWithShortPassword() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("123");

        mockMvc.perform(post("/api/v1/auth/login").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
