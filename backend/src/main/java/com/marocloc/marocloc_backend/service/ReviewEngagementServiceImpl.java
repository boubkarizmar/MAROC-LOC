package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.ReviewEngagementResponse;
import com.marocloc.marocloc_backend.model.PropertyRating;
import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import com.marocloc.marocloc_backend.repository.PropertyRatingRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewEngagementServiceImpl implements ReviewEngagementService {

    private final PropertyRatingRepository propertyRatingRepository;
    private final ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public ReviewEngagementResponse computePropertyRatingSummary(Long propertyId) {
        Double overallAvg = reviewRepository.getAverageRatingByPropertyId(propertyId);
        Long totalReviews = reviewRepository.countByPropertyIdAndStatusApproved(propertyId);

        Map<RatingDimension, Double> dimensionAverages = computeDimensionAverages(propertyId);
        Map<Integer, Long> distribution = getRatingDistribution(propertyId);

        double recommendationRate = 0.0;
        if (totalReviews != null && totalReviews > 0) {
            Long fourAndFiveStars = distribution.getOrDefault(4, 0L) + distribution.getOrDefault(5, 0L);
            recommendationRate = Math.round((fourAndFiveStars * 100.0 / totalReviews) * 10.0) / 10.0;
        }

        return ReviewEngagementResponse.builder()
                .propertyId(propertyId)
                .overallAverage(overallAvg != null ? Math.round(overallAvg * 10.0) / 10.0 : 0.0)
                .dimensionAverages(dimensionAverages)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .ratingDistribution(distribution)
                .recommendationRate(recommendationRate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<RatingDimension, Double> computeDimensionAverages(Long propertyId) {
        Map<RatingDimension, Double> averages = new EnumMap<>(RatingDimension.class);
        List<Object[]> results = propertyRatingRepository.getAverageByDimensionForProperty(propertyId);

        for (Object[] result : results) {
            RatingDimension dimension = (RatingDimension) result[0];
            Double avg = (Double) result[1];
            averages.put(dimension, Math.round(avg * 10.0) / 10.0);
        }

        // Ensure all dimensions have a value
        for (RatingDimension dim : RatingDimension.values()) {
            averages.putIfAbsent(dim, 0.0);
        }

        return averages;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Integer, Long> getRatingDistribution(Long propertyId) {
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        // Count using overall dimension
        for (int score = 1; score <= 5; score++) {
            Long count = propertyRatingRepository.countByPropertyAndDimensionAndScore(
                    propertyId, RatingDimension.OVERALL, score);
            distribution.put(score, count != null ? count : 0L);
        }

        return distribution;
    }
}
