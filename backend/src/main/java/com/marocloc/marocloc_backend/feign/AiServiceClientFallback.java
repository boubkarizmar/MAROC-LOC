package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AiServiceClientFallback implements AiServiceClient {

    @Override
    public ApiResponse<Map<String, Object>> getRecommendations(Map<String, Object> request) {
        log.warn("AI service fallback triggered for recommendations");
        return ApiResponse.success(Map.of("recommendations", List.of()), "Fallback: popularity-based recommendations");
    }

    @Override
    public ApiResponse<Map<String, Object>> checkFraud(Map<String, Object> request) {
        log.warn("AI service fallback triggered for fraud detection");
        return ApiResponse.success(Map.of("score", 0.0, "decision", "MANUAL_REVIEW"), "Fallback: manual review required");
    }

    @Override
    public ApiResponse<Map<String, Object>> chat(Map<String, Object> request) {
        log.warn("AI service fallback triggered for chat");
        return ApiResponse.success(Map.of("reply", "Service temporairement indisponible. Veuillez réessayer plus tard."), "Fallback");
    }

    @Override
    public ApiResponse<Map<String, Object>> predictLTV(Map<String, Object> request) {
        log.warn("AI service fallback triggered for LTV");
        return ApiResponse.success(Map.of("predicted_ltv", 0.0), "Fallback");
    }
}
