package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.AdvertisementPlan;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementPlanCheckoutRequest {

    @NotNull(message = "Plan is required")
    private AdvertisementPlan plan;

    @NotEmpty(message = "At least one property ID is required")
    private List<Long> propertyIds;

    private String targetAudience;

    private Integer durationMonths;

    private String successUrl;

    private String cancelUrl;
}
