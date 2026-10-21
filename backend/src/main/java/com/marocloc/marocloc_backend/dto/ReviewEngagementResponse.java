package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewEngagementResponse {

    private Long propertyId;
    private Double overallAverage;
    private Map<RatingDimension, Double> dimensionAverages;
    private Long totalReviews;
    private Map<Integer, Long> ratingDistribution;
    private Double recommendationRate;
}
