package com.marocloc.marocloc_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalyticsDTO {

    private String period;
    private BigDecimal mrr;
    private BigDecimal arr;
    private BigDecimal totalRevenue;
    private Integer activeSubscriptions;
    private Integer newSubscriptions;
    private Integer churnedSubscriptions;
    private BigDecimal churnRate;
    private BigDecimal arpu;
    private BigDecimal ltv;
    private BigDecimal cac;
    private Map<String, BigDecimal> revenueByTier;
    private Map<String, BigDecimal> revenueByCity;
}
