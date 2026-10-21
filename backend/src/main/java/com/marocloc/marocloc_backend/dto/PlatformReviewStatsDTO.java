package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformReviewStatsDTO {
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> distribution;
}
