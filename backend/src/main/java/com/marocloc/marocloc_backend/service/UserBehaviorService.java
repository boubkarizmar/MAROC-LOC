package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.model.UserBehavior;
import com.marocloc.marocloc_backend.repository.UserBehaviorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for tracking and analyzing user behavior
 * Provides data for ML-based recommendations
 */
@Service
@RequiredArgsConstructor
public class UserBehaviorService {

    private final UserBehaviorRepository behaviorRepository;

    /**
     * Track a user behavior event
     */
    @Transactional
    public void trackBehavior(User user, String behaviorType, String entityType,
                            Long entityId, String metadata, Double weight,
                            String sessionId, String ipAddress, String userAgent) {
        UserBehavior behavior = UserBehavior.builder()
                .user(user)
                .behaviorType(behaviorType)
                .entityType(entityType)
                .entityId(entityId)
                .metadata(metadata)
                .weight(weight != null ? weight : 1.0)
                .sessionId(sessionId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .build();

        behaviorRepository.save(behavior);
    }

    /**
     * Track property view
     */
    public void trackPropertyView(User user, Long propertyId, Integer durationSeconds,
                                String sessionId, String ipAddress, String userAgent) {
        String metadata = String.format("{\"duration_seconds\": %d}",
                durationSeconds != null ? durationSeconds : 0);
        trackBehavior(user, "VIEW", "PROPERTY", propertyId, metadata, 1.0,
                     sessionId, ipAddress, userAgent);
    }

    /**
     * Track search query
     */
    public void trackSearch(User user, String searchQuery, Map<String, Object> searchParams,
                          String sessionId, String ipAddress, String userAgent) {
        String metadata = String.format("{\"query\": \"%s\", \"params\": %s}",
                searchQuery, searchParams.toString());
        trackBehavior(user, "SEARCH", "SEARCH_QUERY", null, metadata, 1.5,
                     sessionId, ipAddress, userAgent);
    }

    /**
     * Track favorite/bookmark
     */
    public void trackFavorite(User user, Long propertyId, String sessionId,
                            String ipAddress, String userAgent) {
        trackBehavior(user, "FAVORITE", "PROPERTY", propertyId, null, 2.0,
                     sessionId, ipAddress, userAgent);
    }

    /**
     * Track contact attempt
     */
    public void trackContact(User user, Long propertyId, String contactType,
                           String sessionId, String ipAddress, String userAgent) {
        String metadata = String.format("{\"contact_type\": \"%s\"}", contactType);
        trackBehavior(user, "CONTACT", "PROPERTY", propertyId, metadata, 3.0,
                     sessionId, ipAddress, userAgent);
    }

    /**
     * Get user's behavior history
     */
    public List<UserBehavior> getUserBehaviorHistory(Long userId) {
        return behaviorRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get user's recent behaviors
     */
    public List<UserBehavior> getRecentBehaviors(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return behaviorRepository.findRecentBehaviors(userId, since);
    }

    /**
     * Get properties user has interacted with
     */
    public List<Long> getInteractedPropertyIds(Long userId) {
        return behaviorRepository.findInteractedPropertyIds(userId);
    }

    /**
     * Check if user has viewed a property
     */
    public boolean hasViewedProperty(Long userId, Long propertyId) {
        return behaviorRepository.countBehaviorForProperty(userId, propertyId, "VIEW") > 0;
    }

    /**
     * Get user's session behaviors
     */
    public List<UserBehavior> getSessionBehaviors(String sessionId) {
        return behaviorRepository.findBySessionId(sessionId);
    }
}