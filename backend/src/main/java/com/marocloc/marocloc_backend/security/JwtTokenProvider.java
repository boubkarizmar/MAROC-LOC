package com.marocloc.marocloc_backend.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT Token Provider wrapper around JwtUtil for compatibility with
 * WebSocket auth interceptor and other components.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtUtil jwtUtil;

    /**
     * Validate a JWT token (signature and expiration).
     */
    public boolean validateToken(String token) {
        try {
            Date expiration = jwtUtil.extractExpiration(token);
            return expiration.after(new Date());
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get authentication object from token.
     */
    public Authentication getAuthentication(String token) {
        Claims claims = jwtUtil.extractAllClaims(token);
        String username = claims.getSubject();

        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);

        List<SimpleGrantedAuthority> authorities = roles != null
                ? roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList())
                : List.of();

        UserDetails userDetails = new User(username, "", authorities);
        return new UsernamePasswordAuthenticationToken(userDetails, token, authorities);
    }

    /**
     * Extract user ID (subject) from token.
     */
    public String getUserIdFromToken(String token) {
        return jwtUtil.extractUsername(token);
    }

    /**
     * Extract roles from token as comma-separated string.
     */
    @SuppressWarnings("unchecked")
    public String getRolesFromToken(String token) {
        try {
            Claims claims = jwtUtil.extractAllClaims(token);
            List<String> roles = claims.get("roles", List.class);
            return roles != null ? String.join(",", roles) : "";
        } catch (Exception e) {
            log.warn("Failed to extract roles from token: {}", e.getMessage());
            return "";
        }
    }


}
