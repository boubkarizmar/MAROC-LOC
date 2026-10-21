package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.ReviewEngagementResponse;
import com.marocloc.marocloc_backend.model.enums.RatingDimension;

import java.util.Map;

public interface ReviewEngagementService {

    ReviewEngagementResponse computePropertyRatingSummary(Long propertyId);

    Map<RatingDimension, Double> computeDimensionAverages(Long propertyId);

    Map<Integer, Long> getRatingDistribution(Long propertyId);
}
