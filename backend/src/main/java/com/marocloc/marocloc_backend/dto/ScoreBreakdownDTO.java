package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreBreakdownDTO {
    private Integer engagement;
    private Integer favorites;
    private Integer messages;
    private Integer reviews;
    private Integer conversion;
    private Integer freshness;
    private Integer trust;
}
