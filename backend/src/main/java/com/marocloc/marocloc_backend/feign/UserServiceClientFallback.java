package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class UserServiceClientFallback implements UserServiceClient {

    @Override
    public ApiResponse<Map<String, Object>> getUserById(Long id) {
        log.warn("User service fallback triggered for user {}", id);
        return ApiResponse.notFound("User service temporarily unavailable");
    }

    @Override
    public ApiResponse<Map<String, Object>> getUserSubscription(Long id) {
        log.warn("User service fallback triggered for subscription");
        return ApiResponse.success(Map.of("tier", "FREE"), "Fallback: FREE tier assumed");
    }

    @Override
    public ApiResponse<Map<String, Object>> getUserProfile(Long id) {
        log.warn("User service fallback triggered for profile");
        return ApiResponse.success(Map.of(), "Fallback: empty profile");
    }
}
