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
public class OwnerDashboardDTO {

    private Long ownerId;
    private String ownerName;

    // Property stats
    private Integer totalProperties;
    private Integer activeProperties;
    private Integer pendingProperties;
    private Long totalPropertyViews;
    private Long totalFavorites;
    private Long totalInquiries;

    // Review stats
    private Double averageRating;
    private Integer totalReviews;
    private Integer newReviewsThisMonth;

    // Revenue
    private BigDecimal totalAdSpend;
    private BigDecimal adRevenueThisMonth;
    private Integer activeAds;
    private Integer totalAds;

    // Performance
    private List<Map<String, Object>> topProperties;
    private List<Map<String, Object>> propertyViewsTrend;
    private List<Map<String, Object>> inquiryTrend;
}
