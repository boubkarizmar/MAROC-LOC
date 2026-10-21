package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enhanced Recommendation Response DTO
 * Includes AI scoring, match reasons, and metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {

    private Long propertyId;
    private String title;
    private String city;
    private String address;
    private Double price;
    private String propertyType;
    private String category;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double surface;
    private String imageUrl;
    private Double latitude;
    private Double longitude;

    // AI Scoring
    private Double matchScore; // 0.0 - 100.0
    private List<String> matchReasons; // Why this was recommended
    private String recommendationType; // COLLABORATIVE, CONTENT_BASED, TRENDING, GEO, HYBRID

    // Engagement metrics
    private Integer viewCount;
    private Integer favoriteCount;
    private Double averageRating;
    private Integer reviewCount;

    // Distance in km (for geo-based recommendations)
    private Double distanceKm;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime listedAt;
}
