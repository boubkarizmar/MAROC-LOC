package com.marocloc.marocloc_backend.churn.dto;

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
public class ChurnPredictionDTO {

    private Long userId;
    private Double churnProbability;
    private String riskLevel;  // HIGH, MEDIUM, LOW
    private Integer daysSinceLastActivity;
    private Integer daysUntilRenewal;
    private BigDecimal currentMrr;
    private List<String> riskFactors;
    private Map<String, Object> featureContributions;
    private String recommendedAction;
}
