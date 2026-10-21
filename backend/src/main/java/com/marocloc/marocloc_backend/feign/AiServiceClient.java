package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "ai-service", fallback = AiServiceClientFallback.class)
public interface AiServiceClient {

    @PostMapping("/ai/recommendations")
    ApiResponse<Map<String, Object>> getRecommendations(@RequestBody Map<String, Object> request);

    @PostMapping("/ai/fraud/check")
    ApiResponse<Map<String, Object>> checkFraud(@RequestBody Map<String, Object> request);

    @PostMapping("/ai/rag/chat")
    ApiResponse<Map<String, Object>> chat(@RequestBody Map<String, Object> request);

    @PostMapping("/ai/ltv/predict")
    ApiResponse<Map<String, Object>> predictLTV(@RequestBody Map<String, Object> request);
}
