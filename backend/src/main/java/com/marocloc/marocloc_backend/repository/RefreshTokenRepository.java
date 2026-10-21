package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.RefreshToken;
import com.marocloc.marocloc_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for refresh token lifecycle management.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserAndRevokedFalse(User user);

    void deleteByExpiresAtBefore(java.time.LocalDateTime cutoff);
}
