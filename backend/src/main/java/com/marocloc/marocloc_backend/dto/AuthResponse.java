package com.marocloc.marocloc_backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Enhanced DTO for authentication response with access and refresh tokens
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType; // "Bearer"
    private Long expiresIn; // Access token expiration in seconds
    private Long refreshExpiresIn; // Refresh token expiration in seconds
    private Long userId;
    private String name;
    private String email;
    private String role;
}