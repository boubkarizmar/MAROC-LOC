package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.RefreshToken;
import com.marocloc.marocloc_backend.model.User;

/**
 * Service responsible for refresh token lifecycle and revocation.
 */
public interface RefreshTokenService {

    RefreshToken createRefreshToken(User user, String rawRefreshToken);

    RefreshToken validateRefreshToken(String rawRefreshToken);

    void revokeRefreshToken(String rawRefreshToken);

    void revokeAllActiveTokens(User user);
}
