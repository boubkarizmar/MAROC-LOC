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
public class YearlyPointDTO {
    private int year;
    private int users;
    private int properties;
    private int ads;
    private int reviews;
    private BigDecimal revenue;
    private long visitors;
}
