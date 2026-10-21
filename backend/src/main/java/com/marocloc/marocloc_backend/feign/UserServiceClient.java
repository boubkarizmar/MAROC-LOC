package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "user-service", fallback = UserServiceClientFallback.class)
public interface UserServiceClient {

    @GetMapping("/api/v1/users/{id}")
    ApiResponse<Map<String, Object>> getUserById(@PathVariable("id") Long id);

    @GetMapping("/api/v1/users/{id}/subscription")
    ApiResponse<Map<String, Object>> getUserSubscription(@PathVariable("id") Long id);

    @GetMapping("/api/v1/users/{id}/profile")
    ApiResponse<Map<String, Object>> getUserProfile(@PathVariable("id") Long id);
}
