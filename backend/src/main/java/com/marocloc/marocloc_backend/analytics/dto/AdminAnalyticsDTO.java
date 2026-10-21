package com.marocloc.marocloc_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsDTO {

    // User metrics
    private Integer totalUsers;
    private Integer newUsersThisMonth;
    private Integer activeUsersToday;
    private Integer verifiedUsers;
    private Integer proprietaireCount;
    private Integer adminCount;

    // Property metrics
    private Integer totalProperties;
    private Integer pendingProperties;
    private Integer approvedProperties;
    private Integer propertiesThisMonth;
    private Double averagePropertyPrice;

    // Engagement metrics
    private Long totalViews;
    private Long totalSearches;
    private Long totalMessages;
    private Long totalFavorites;
    private Long totalReviews;
    private Double averageReviewRating;

    // Revenue metrics
    private BigDecimal totalRevenue;
    private BigDecimal revenueThisMonth;
    private Integer totalAdPayments;
    private BigDecimal averageAdSpend;

    // Trends
    private List<Map<String, Object>> userSignupsTrend;
    private List<Map<String, Object>> propertyCreationTrend;
    private List<Map<String, Object>> revenueTrend;
    private List<Map<String, Object>> engagementTrend;

    // Geographic
    private List<Map<String, Object>> topCities;
    private List<Map<String, Object>> propertyTypeDistribution;
}
