package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.RecommendationResponse;

import java.util.List;

/**
 * Enhanced Recommendation Service Interface
 * Provides AI-powered property recommendations with explainability.
 */
public interface RecommendationService {

    /**
     * Get personalized recommendations for a user using hybrid AI model.
     */
    List<RecommendationResponse> getRecommendations(Long userId);

    /**
     * Get personalized recommendations with explicit limit.
     */
    List<RecommendationResponse> getRecommendations(Long userId, int limit);

    /**
     * Get similar properties based on content features.
     */
    List<RecommendationResponse> getSimilarProperties(Long propertyId);

    /**
     * Get similar properties with explicit limit.
     */
    List<RecommendationResponse> getSimilarProperties(Long propertyId, int limit);

    /**
     * Get trending properties (most viewed/favorited/contacted).
     */
    List<RecommendationResponse> getTrendingProperties(String period);

    /**
     * Get trending properties with explicit limit.
     */
    List<RecommendationResponse> getTrendingProperties(String period, int limit);

    /**
     * Get geo-based recommendations near a location.
     */
    List<RecommendationResponse> getGeoRecommendations(Double latitude, Double longitude, Double radiusKm);

    /**
     * Get geo-based recommendations with explicit limit.
     */
    List<RecommendationResponse> getGeoRecommendations(Double latitude, Double longitude, Double radiusKm, int limit);

    /**
     * Get recommendations for logged-in user based on behavior.
     */
    List<RecommendationResponse> getPersonalizedFeed(Long userId, int limit);

    /**
     * Record user behavior for real-time personalization.
     */
    void recordBehavior(Long userId, String behaviorType, Long propertyId, String metadata);

    /**
     * Record recommendation feedback (click, save, dismiss) for learning.
     */
    void recordRecommendationFeedback(Long userId, Long propertyId, String feedbackType);

    /**
     * Get discover recommendations for anonymous/guest users.
     */
    List<RecommendationResponse> getDiscoverRecommendations(String sessionId, String city, int limit);
}
