package com.marocloc.marocloc_backend.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureUsageResponse {

    private String featureKey;
    private String featureName;
    private Integer usageCount;
    private Integer usageLimit;
    private Integer remaining;
    private Boolean unlimited;
    private Double percentageUsed;
}
