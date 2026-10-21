package com.marocloc.marocloc_backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyPointDTO {
    private String month;       // "2026-01"
    private String monthLabel;  // "Jan" or localized
    private int users;
    private int properties;
    private int ads;
    private int reviews;
    private BigDecimal revenue;
    private long visitors;
}
