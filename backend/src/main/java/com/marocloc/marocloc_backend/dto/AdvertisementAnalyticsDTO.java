package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementAnalyticsDTO {
    private Long advertisementId;
    private Long views;
    private Long clicks;
    private Long impressions;
    private Double ctr;
    private String status;
}
