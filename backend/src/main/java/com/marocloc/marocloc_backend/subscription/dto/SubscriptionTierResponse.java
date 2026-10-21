package com.marocloc.marocloc_backend.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionTierResponse {

    private String tier;
    private String name;
    private String description;
    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;
    private List<String> features;
    private List<String> limits;
    private Boolean current;
}
