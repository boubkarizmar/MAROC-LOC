package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.RefreshToken;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.RefreshTokenRepository;
import com.marocloc.marocloc_backend.security.JwtUtil;
import com.marocloc.marocloc_backend.security.TokenHashUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user, String rawRefreshToken) {
        revokeAllActiveTokens(user);

        long expirationMs = jwtUtil.getRefreshTokenExpiration();
        LocalDateTime expiresAt = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(System.currentTimeMillis() + expirationMs),
                ZoneId.systemDefault());

        LocalDateTime now = LocalDateTime.now();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(TokenHashUtil.hashToken(rawRefreshToken))
                .expiresAt(expiresAt)
                .revoked(false)
                .createdAt(now)
                .lastUsedAt(now)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional
    public RefreshToken validateRefreshToken(String rawRefreshToken) {
        String tokenHash = TokenHashUtil.hashToken(rawRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Refresh token is invalid or expired"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token is invalid or expired");
        }

        refreshToken.setLastUsedAt(LocalDateTime.now());
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String rawRefreshToken) {
        RefreshToken refreshToken = validateRefreshToken(rawRefreshToken);
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional
    public void revokeAllActiveTokens(User user) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserAndRevokedFalse(user);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
        }
        refreshTokenRepository.saveAll(activeTokens);
    }
}