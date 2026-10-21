package com.marocloc.marocloc_backend.fraud.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marocloc.marocloc_backend.fraud.dto.FraudCheckRequest;
import com.marocloc.marocloc_backend.fraud.dto.FraudCheckResponse;
import com.marocloc.marocloc_backend.fraud.dto.FraudCheckResponse.Decision;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudDetectionService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url:http://ai-service:8000}")
    private String aiServiceUrl;

    private static final BigDecimal AUTO_FLAG_THRESHOLD = new BigDecimal("0.70");
    private static final BigDecimal MANUAL_REVIEW_THRESHOLD = new BigDecimal("0.30");

    // Hard rules for immediate flagging
    private static final List<String> SUSPICIOUS_DOMAINS = List.of("tempmail", "guerrillamail", "10minutemail");
    private static final String MOROCCAN_PHONE_REGEX = "^(\\+212|0)[567][0-9]{8}$";

    public FraudCheckResponse analyze(FraudCheckRequest request) {
        List<String> triggeredRules = new ArrayList<>();
        Map<String, Object> features = new HashMap<>();

        // Rule 1: Zero images with high price
        boolean zeroImagesHighPrice = (request.getImageUrls() == null || request.getImageUrls().isEmpty())
                && request.getPrice() != null && request.getPrice().compareTo(new BigDecimal("500000")) > 0;
        features.put("zeroImagesHighPrice", zeroImagesHighPrice);
        if (zeroImagesHighPrice) triggeredRules.add("ZERO_IMAGES_HIGH_PRICE");

        // Rule 2: Very short description
        boolean shortDescription = request.getDescription() != null
                && request.getDescription().length() < 30
                && request.getPrice() != null
                && request.getPrice().compareTo(new BigDecimal("50000")) < 0;
        features.put("shortDescription", shortDescription);
        if (shortDescription) triggeredRules.add("SHORT_DESCRIPTION_LOW_PRICE");

        // Rule 3: Invalid Moroccan phone
        boolean invalidPhone = request.getContactPhone() != null
                && !request.getContactPhone().matches(MOROCCAN_PHONE_REGEX);
        features.put("invalidPhone", invalidPhone);
        if (invalidPhone) triggeredRules.add("INVALID_PHONE_FORMAT");

        // Rule 4: Suspicious email domain
        boolean suspiciousEmail = request.getContactEmail() != null
                && SUSPICIOUS_DOMAINS.stream().anyMatch(d -> request.getContactEmail().contains(d));
        features.put("suspiciousEmail", suspiciousEmail);
        if (suspiciousEmail) triggeredRules.add("SUSPICIOUS_EMAIL_DOMAIN");

        // Rule 5: Price deviation (mock - would query median from DB)
        BigDecimal priceDeviation = calculatePriceDeviation(request);
        features.put("priceDeviation", priceDeviation);
        if (priceDeviation.compareTo(new BigDecimal("5.0")) > 0) triggeredRules.add("PRICE_DEVIATION_EXTREME");

        // Calculate ensemble score
        BigDecimal score = calculateScore(triggeredRules.size(), features);
        Decision decision;
        if (score.compareTo(AUTO_FLAG_THRESHOLD) > 0) {
            decision = Decision.AUTO_FLAG;
        } else if (score.compareTo(MANUAL_REVIEW_THRESHOLD) > 0) {
            decision = Decision.MANUAL_REVIEW;
        } else {
            decision = Decision.AUTO_APPROVE;
        }

        // Try AI microservice for enhanced score
        try {
            FraudCheckResponse aiResponse = callAiFraudService(request, features);
            if (aiResponse != null && aiResponse.getScore() != null) {
                score = score.multiply(new BigDecimal("0.4"))
                        .add(aiResponse.getScore().multiply(new BigDecimal("0.6")));
                score = score.setScale(3, RoundingMode.HALF_UP);
                if (aiResponse.getRulesTriggered() != null) {
                    triggeredRules.addAll(aiResponse.getRulesTriggered());
                }
                // Re-evaluate decision with blended score
                if (score.compareTo(AUTO_FLAG_THRESHOLD) > 0) {
                    decision = Decision.AUTO_FLAG;
                } else if (score.compareTo(MANUAL_REVIEW_THRESHOLD) > 0) {
                    decision = Decision.MANUAL_REVIEW;
                } else {
                    decision = Decision.AUTO_APPROVE;
                }
            }
        } catch (Exception e) {
            log.warn("AI fraud service unavailable, using rule-based only: {}", e.getMessage());
        }

        String explanation = buildExplanation(triggeredRules, request);

        return FraudCheckResponse.builder()
                .propertyId(request.getPropertyId())
                .score(score)
                .decision(decision)
                .confidence(BigDecimal.valueOf(0.85))
                .features(features)
                .rulesTriggered(triggeredRules.stream().distinct().toList())
                .explanation(explanation)
                .modelVersion("fraud-v1.0-hybrid")
                .build();
    }

    private BigDecimal calculatePriceDeviation(FraudCheckRequest request) {
        // Placeholder: in production, query median price per city+type from kaggle_property_raw
        if (request.getPrice() == null || request.getSurface() == null || request.getSurface().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal pricePerM2 = request.getPrice().divide(request.getSurface(), 2, RoundingMode.HALF_UP);
        // Mock median for Casablanca apartments ~8000 MAD/m2
        BigDecimal medianPricePerM2 = new BigDecimal("8000");
        if (request.getCity() != null && request.getCity().toLowerCase().contains("marrakech")) {
            medianPricePerM2 = new BigDecimal("10000");
        } else if (request.getCity() != null && request.getCity().toLowerCase().contains("rabat")) {
            medianPricePerM2 = new BigDecimal("9000");
        }
        return pricePerM2.divide(medianPricePerM2, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateScore(int ruleCount, Map<String, Object> features) {
        BigDecimal baseScore = new BigDecimal("0.05");
        BigDecimal ruleWeight = new BigDecimal("0.18");
        BigDecimal score = baseScore.add(ruleWeight.multiply(new BigDecimal(ruleCount)));

        if (Boolean.TRUE.equals(features.get("zeroImagesHighPrice"))) {
            score = score.add(new BigDecimal("0.25"));
        }
        if (Boolean.TRUE.equals(features.get("priceDeviation"))) {
            BigDecimal deviation = (BigDecimal) features.get("priceDeviation");
            if (deviation.compareTo(new BigDecimal("3")) > 0) {
                score = score.add(new BigDecimal("0.20"));
            }
        }
        return score.min(BigDecimal.ONE).max(BigDecimal.ZERO).setScale(3, RoundingMode.HALF_UP);
    }

    private String buildExplanation(List<String> rules, FraudCheckRequest request) {
        if (rules.isEmpty()) return "Aucun signal suspect détecté.";

        Map<String, String> ruleDescriptions = Map.of(
                "ZERO_IMAGES_HIGH_PRICE", "annonce de grande valeur sans images",
                "SHORT_DESCRIPTION_LOW_PRICE", "description très courte avec prix anormalement bas",
                "INVALID_PHONE_FORMAT", "numéro de téléphone non marocain",
                "SUSPICIOUS_EMAIL_DOMAIN", "adresse e-mail temporaire",
                "PRICE_DEVIATION_EXTREME", "prix anormalement éloigné du marché"
        );

        StringBuilder sb = new StringBuilder("Signaux suspects détectés : ");
        for (int i = 0; i < rules.size(); i++) {
            sb.append(ruleDescriptions.getOrDefault(rules.get(i), rules.get(i)));
            if (i < rules.size() - 1) sb.append(", ");
        }
        return sb.toString();
    }

    private FraudCheckResponse callAiFraudService(FraudCheckRequest request, Map<String, Object> features) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("property_id", request.getPropertyId());
        body.put("text", request.getTitle() + " " + request.getDescription());
        body.put("price", request.getPrice());
        body.put("images", request.getImageUrls());
        body.put("user_id", request.getUserId());
        body.put("ip_address", request.getIpAddress());
        body.put("features", features);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/fraud/check", entity, Map.class);

        if (response.getBody() == null) return null;

        Map<String, Object> resp = response.getBody();
        return FraudCheckResponse.builder()
                .score(BigDecimal.valueOf(((Number) resp.getOrDefault("score", 0)).doubleValue()))
                .rulesTriggered((List<String>) resp.getOrDefault("rules_triggered", List.of()))
                .build();
    }
}
