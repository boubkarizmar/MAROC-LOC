package com.marocloc.marocloc_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngagementChartDTO {

    private String metricName;
    private String period;
    private List<TimeSeriesPointDTO> dataPoints;
    private Map<String, Object> summary;
}
