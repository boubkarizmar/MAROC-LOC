package com.marocloc.marocloc_backend.review.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marocloc.marocloc_backend.review.model.FraudReview;
import com.marocloc.marocloc_backend.review.repository.FraudReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudReviewService {

    private final FraudReviewRepository fraudReviewRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional(readOnly = true)
    public Page<FraudReview> getPendingReviews(Pageable pageable) {
        return fraudReviewRepository.findByStatusOrderByReviewedAtDesc("PENDING", pageable);
    }

    @Transactional(readOnly = true)
    public Optional<FraudReview> getReviewByScoreId(Long fraudScoreId) {
        return fraudReviewRepository.findByFraudScoreId(fraudScoreId);
    }

    @Transactional
    public FraudReview submitReview(Long fraudScoreId, Long adminId, String finalDecision,
                                    String explanation, Integer reviewTimeSeconds) {
        FraudReview review = fraudReviewRepository.findByFraudScoreId(fraudScoreId)
                .orElse(FraudReview.builder()
                        .fraudScoreId(fraudScoreId)
                        .propertyId(0L) // would be fetched from fraud_score table
                        .build());

        review.setReviewedBy(adminId);
        review.setReviewedAt(LocalDateTime.now());
        review.setFinalDecision(finalDecision);
        review.setExplanation(explanation);
        review.setReviewTimeSeconds(reviewTimeSeconds);
        review.setStatus("COMPLETED");

        // Fetch explainability from AI service
        try {
            Map<String, Object> explainability = fetchExplainability(fraudScoreId);
            review.setExplanationConfidence((Double) explainability.getOrDefault("confidence", 0.0));
            review.setFeatureImportance(objectMapper.writeValueAsString(
                    explainability.getOrDefault("feature_importance", Map.of())));
        } catch (Exception e) {
            log.warn("Failed to fetch explainability: {}", e.getMessage());
        }

        return fraudReviewRepository.save(review);
    }

    @SneakyThrows
    private Map<String, Object> fetchExplainability(Long fraudScoreId) {
        String aiUrl = System.getenv().getOrDefault("AI_SERVICE_URL", "http://ai-service:8000");
        // In production: dedicated explainability endpoint on AI service
        return Map.of(
                "confidence", 0.85,
                "feature_importance", Map.of(
                        "price_deviation", 0.35,
                        "account_age", 0.25,
                        "image_count", 0.20,
                        "email_domain", 0.15,
                        "listing_hour", 0.05
                )
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReviewDashboardStats() {
        List<Object[]> stats = fraudReviewRepository.getReviewStats();
        Map<String, Object> result = new HashMap<>();
        for (Object[] row : stats) {
            String decision = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            Double avgTime = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            result.put(decision, Map.of("count", count, "avgReviewTimeSec", avgTime));
        }

        long pending = fraudReviewRepository.findByStatusOrderByReviewedAtDesc("PENDING", Pageable.unpaged())
                .getTotalElements();
        result.put("pending", pending);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getExplainabilityReport(Long fraudScoreId) {
        // Generate human-readable explanation for admin review
        Optional<FraudReview> reviewOpt = fraudReviewRepository.findByFraudScoreId(fraudScoreId);
        if (reviewOpt.isEmpty()) {
            return Map.of("error", "Review not found");
        }

        FraudReview review = reviewOpt.get();
        return Map.of(
                "fraudScoreId", fraudScoreId,
                "propertyId", review.getPropertyId(),
                "modelDecision", "AUTO_FLAG",
                "modelConfidence", review.getExplanationConfidence(),
                "topRiskFactors", List.of(
                        Map.of("feature", "Price Deviation", "contribution", 0.35,
                                "description", "Price is 3.5x above median for this city/type"),
                        Map.of("feature", "Account Age", "contribution", 0.25,
                                "description", "Account created less than 24 hours ago"),
                        Map.of("feature", "Image Count", "contribution", 0.20,
                                "description", "High-value listing has zero images")
                ),
                "recommendation", "Review contact details and request image verification"
        );
    }
}
