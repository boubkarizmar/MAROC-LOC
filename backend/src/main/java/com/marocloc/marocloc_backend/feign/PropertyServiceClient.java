package com.marocloc.marocloc_backend.feign;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "property-service", fallback = PropertyServiceClientFallback.class)
public interface PropertyServiceClient {

    @GetMapping("/api/v2/properties/{id}")
    ApiResponse<Map<String, Object>> getPropertyById(@PathVariable("id") Long id);

    @GetMapping("/api/v2/properties/{id}/similar")
    ApiResponse<List<Map<String, Object>>> getSimilarProperties(@PathVariable("id") Long id,
                                                                   @RequestParam(defaultValue = "5") int limit);

    @GetMapping("/api/v2/properties/nearby")
    ApiResponse<List<Map<String, Object>>> getNearbyProperties(@RequestParam double lat,
                                                                  @RequestParam double lng,
                                                                  @RequestParam(defaultValue = "5") double radiusKm);
}
