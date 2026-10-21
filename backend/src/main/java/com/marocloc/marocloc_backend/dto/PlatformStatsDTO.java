package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDTO {
    private Long verifiedProperties;
    private Long activeUsers;
    private Integer averageResponseTimeMinutes;
    private Double satisfactionRate;
}
