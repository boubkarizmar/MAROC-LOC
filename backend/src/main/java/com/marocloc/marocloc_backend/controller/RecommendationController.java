package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.RecommendationFeedbackRequest;
import com.marocloc.marocloc_backend.dto.RecommendationResponse;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for intelligent property recommendations.
 * Provides personalized, similar, trending, and geo-based recommendations.
 */
@Slf4j
@RestController
@RequestMapping(ApiRoutes.RECOMMENDATIONS)
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Get personalized recommendations for the authenticated user.
     */
    @GetMapping("/personalized")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RecommendationResponse>> getPersonalized(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "12") int limit) {
        Long userId = extractUserId(userDetails);
        List<RecommendationResponse> recommendations = recommendationService.getRecommendations(userId, limit);
        sendRecommendationNotification(userId, recommendations);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Get properties similar to a given property.
     */
    @GetMapping("/similar/{propertyId}")
    public ResponseEntity<List<RecommendationResponse>> getSimilar(
            @PathVariable Long propertyId,
            @RequestParam(defaultValue = "8") int limit) {
        List<RecommendationResponse> similar = recommendationService.getSimilarProperties(propertyId, limit);
        return ResponseEntity.ok(similar);
    }

    /**
     * Get trending properties for a time period.
     */
    @GetMapping("/trending")
    public ResponseEntity<List<RecommendationResponse>> getTrending(
            @RequestParam(defaultValue = "week") String period,
            @RequestParam(defaultValue = "10") int limit) {
        List<RecommendationResponse> trending = recommendationService.getTrendingProperties(period, limit);
        return ResponseEntity.ok(trending);
    }

    /**
     * Get nearby properties based on geo coordinates.
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<RecommendationResponse>> getNearby(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double radiusKm,
            @RequestParam(defaultValue = "12") int limit) {
        List<RecommendationResponse> nearby = recommendationService.getGeoRecommendations(latitude, longitude, radiusKm, limit);
        return ResponseEntity.ok(nearby);
    }

    /**
     * Get personalized feed for the authenticated user.
     */
    @GetMapping("/feed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RecommendationResponse>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = extractUserId(userDetails);
        List<RecommendationResponse> feed = recommendationService.getPersonalizedFeed(userId, limit);
        sendRecommendationNotification(userId, feed);
        return ResponseEntity.ok(feed);
    }

    /**
     * Get discover recommendations for anonymous/guest users.
     */
    @GetMapping("/discover")
    public ResponseEntity<List<RecommendationResponse>> getDiscover(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "12") int limit) {
        List<RecommendationResponse> discover = recommendationService.getDiscoverRecommendations(sessionId, city, limit);
        return ResponseEntity.ok(discover);
    }

    /**
     * Record recommendation feedback (click, save, dismiss) for learning.
     */
    @PostMapping("/feedback")
    @PreAuthorize("isAuthenticated()")
    @CacheEvict(value = "recommendations", key = "'user:' + #userId")
    public ResponseEntity<Map<String, String>> recordFeedback(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RecommendationFeedbackRequest request) {
        Long userId = extractUserId(userDetails);
        recommendationService.recordRecommendationFeedback(userId, request.getPropertyId(), request.getFeedbackType());
        return ResponseEntity.ok(Map.of("status", "recorded"));
    }

    private void sendRecommendationNotification(Long userId, List<RecommendationResponse> recommendations) {
        if (userId == null || recommendations == null || recommendations.isEmpty()) {
            return;
        }
        RecommendationResponse top = recommendations.get(0);
        if (top.getPropertyId() != null) {
            try {
                notificationService.createFromTemplate(NotificationTemplate.aiRecommendation(
                        userId, top.getPropertyId(), top.getTitle()));
            } catch (Exception e) {
                log.warn("Failed to send recommendation notification for user {}", userId, e);
            }
        }
    }

    private Long extractUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
