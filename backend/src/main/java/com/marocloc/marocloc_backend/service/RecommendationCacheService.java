package com.marocloc.marocloc_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Recommendation cache service stub.
 * Handles recommendation feedback events and cache invalidation.
 * Full implementation with Redis caching can be added later.
 */
@Slf4j
@Service
public class RecommendationCacheService {

    /**
     * Record a user click on a property recommendation.
     */
    public void recordClick(Long userId, Long propertyId, String modelVersion) {
        log.debug("Recording click: user={}, property={}, model={}", userId, propertyId, modelVersion);
        // TODO: Implement Redis-based feedback storage for model retraining
    }

    /**
     * Invalidate recommendation cache for a specific user.
     */
    public void invalidateUserCache(Long userId) {
        log.debug("Invalidating recommendation cache for user={}", userId);
        // TODO: Implement Redis cache eviction
    }
}
