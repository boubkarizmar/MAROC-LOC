package com.marocloc.marocloc_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Enhanced JWT utility with refresh token support and security best practices
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.access.expiration:900000}") // 15 minutes for access tokens
    private Long accessTokenExpiration;

    @Value("${jwt.refresh.expiration:604800000}") // 7 days for refresh tokens
    private Long refreshTokenExpiration;

    @PostConstruct
    public void ensureValidSecret() {
        if (secret == null || secret.isBlank() ||
            secret.equals("your-256-bit-secret-key-here-change-in-production-32-chars-min")) {
            throw new IllegalStateException(
                "JWT secret must be configured via JWT_SECRET environment variable " +
                "and must be at least 32 characters long. Current value is invalid."
            );
        }
        if (secret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters long");
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters long");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate access token for user
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "access");
        claims.put("roles", userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .toList());
        return createToken(claims, userDetails.getUsername(), accessTokenExpiration);
    }

    /**
     * Generate refresh token for user
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return createToken(claims, userDetails.getUsername(), refreshTokenExpiration);
    }

    /**
     * Generate both access and refresh tokens
     */
    public Map<String, String> generateTokenPair(UserDetails userDetails) {
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", generateAccessToken(userDetails));
        tokens.put("refreshToken", generateRefreshToken(userDetails));
        return tokens;
    }

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }

    /**
     * Create token with claims and expiration
     */
    private String createToken(Map<String, Object> claims, String subject, Long expirationMs) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .setIssuer("marocloc-backend")
                .setAudience("marocloc-users")
                .setId(UUID.randomUUID().toString())
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract token type (access/refresh)
     */
    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }

    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract specific claim from token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from token
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Check if token is expired
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Validate access token
     */
    public Boolean validateAccessToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            final String tokenType = extractTokenType(token);
            return (username.equals(userDetails.getUsername())
                    && "access".equals(tokenType)
                    && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Validate refresh token
     */
    public Boolean validateRefreshToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            final String tokenType = extractTokenType(token);
            return (username.equals(userDetails.getUsername())
                    && "refresh".equals(tokenType)
                    && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if token is close to expiration (within 5 minutes)
     */
    public Boolean isTokenNearExpiration(String token) {
        try {
            Date expiration = extractExpiration(token);
            long timeUntilExpiration = expiration.getTime() - System.currentTimeMillis();
            return timeUntilExpiration < 300000; // 5 minutes
        } catch (Exception e) {
            return true; // Consider expired if parsing fails
        }
    }
}