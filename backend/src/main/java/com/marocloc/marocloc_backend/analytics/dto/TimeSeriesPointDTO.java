package com.marocloc.marocloc_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSeriesPointDTO {

    private String date;
    private Long value;
    private Double avgValue;
}
