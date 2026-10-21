package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class PropertyServiceClientFallback implements PropertyServiceClient {

    @Override
    public ApiResponse<Map<String, Object>> getPropertyById(Long id) {
        log.warn("Property service fallback triggered for property {}", id);
        return ApiResponse.notFound("Property service temporarily unavailable");
    }

    @Override
    public ApiResponse<List<Map<String, Object>>> getSimilarProperties(Long id, int limit) {
        log.warn("Property service fallback triggered for similar properties");
        return ApiResponse.success(List.of(), "Fallback: empty similar properties");
    }

    @Override
    public ApiResponse<List<Map<String, Object>>> getNearbyProperties(double lat, double lng, double radiusKm) {
        log.warn("Property service fallback triggered for nearby search");
        return ApiResponse.success(List.of(), "Fallback: empty nearby properties");
    }
}
