package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnimatedStatsDTO {
    private Long totalUsers;
    private Long totalOwners;
    private Long totalProperties;
    private Long totalAds;
    private Long totalRentals;
    private Long totalCities;
}
