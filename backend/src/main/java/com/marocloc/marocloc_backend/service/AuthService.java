package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AuthResponse;
import com.marocloc.marocloc_backend.dto.LoginRequest;
import com.marocloc.marocloc_backend.dto.RegisterRequest;
import com.marocloc.marocloc_backend.dto.RefreshTokenRequest;

/**
 * Authentication service interface
 * Handles user registration, login, and token refresh operations
 */
public interface AuthService {

    /**
     * Register a new user (Locataire or Propriétaire)
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticate user and return JWT token pair
     */
    AuthResponse login(LoginRequest request);

    /**
     * Refresh access token using refresh token
     */
    AuthResponse refreshToken(RefreshTokenRequest request);

    /**
     * Logout by revoking the provided refresh token
     */
    void logout(RefreshTokenRequest request);
}