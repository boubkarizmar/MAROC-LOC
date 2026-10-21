package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementPlanInfoDTO {
    private String name;
    private String displayName;
    private String description;
    private Long amountMinorUnits;
    private Integer maxProperties;
    private Integer maxImages;
    private Boolean videoAllowed;
    private Boolean homepagePlacement;
    private Boolean featuredBadge;
    private Boolean supportsAdvancedTargeting;
    private Integer durationDays;
}
