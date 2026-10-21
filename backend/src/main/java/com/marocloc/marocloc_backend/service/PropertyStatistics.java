package com.marocloc.marocloc_backend.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Property statistics for dashboard and analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyStatistics {

    private long totalProperties;
    private long pendingProperties;
    private long approvedProperties;
    private long rejectedProperties;

    private BigDecimal averagePrice;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private List<String> availableCities;
    private List<String> propertyTypes;
    private List<String> categories;

    // Additional metrics
    private long totalViews;
    private long propertiesThisMonth;
    private double averageDiscountPercentage;

    // Geographic distribution
    private List<CityStats> cityStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityStats {
        private String city;
        private long propertyCount;
        private double averagePrice;
        private long totalViews;
    }
}