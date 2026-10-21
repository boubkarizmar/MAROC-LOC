package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for tracking recommendation events (impressions, clicks, dismissals).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationEventRequest {

    @NotBlank(message = "Event type is required")
    private String eventType; // IMPRESSION, CLICK, DISMISS, HOVER

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    private String recommendationType; // COLLABORATIVE, CONTENT_BASED, TRENDING, DISCOVER, etc.

    private Double matchScore;

    private Integer position;

    private String sessionId;

    private String page; // home, search, property_detail, etc.

    // Batch events for efficient tracking
    private List<SingleRecommendationEvent> batchEvents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SingleRecommendationEvent {
        private String eventType;
        private Long propertyId;
        private String recommendationType;
        private Double matchScore;
        private Integer position;
    }
}
