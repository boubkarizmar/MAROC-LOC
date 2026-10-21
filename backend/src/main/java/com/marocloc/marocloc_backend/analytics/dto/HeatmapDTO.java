package com.marocloc.marocloc_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapDTO {

    private Double latitude;
    private Double longitude;
    private Integer intensity;
    private Long propertyCount;
    private Double averagePrice;
    private String city;
    private String neighborhood;
}
