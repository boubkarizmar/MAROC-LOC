package com.marocloc.marocloc_backend.abtest.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.abtest.service.ABTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.V1 + "/abtest")
@RequiredArgsConstructor
public class ABTestController {

    private final ABTestService abTestService;
    private final UserRepository userRepository;

    @GetMapping("/variant/{experimentKey}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getVariant(
            @PathVariable String experimentKey,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        String variant = abTestService.getVariant(userId, experimentKey);
        return ResponseEntity.ok(ApiResponse.success(Map.of("variant", variant)));
    }

    @PostMapping("/convert/{experimentKey}")
    public ResponseEntity<ApiResponse<Void>> recordConversion(
            @PathVariable String experimentKey,
            @RequestParam String metric,
            @RequestParam(defaultValue = "1.0") Double value,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        abTestService.recordConversion(userId, experimentKey, metric, value);
        return ResponseEntity.ok(ApiResponse.success(null, "Conversion recorded"));
    }

    private Long extractUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }

    @GetMapping("/results/{experimentKey}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResults(
            @PathVariable String experimentKey) {
        return ResponseEntity.ok(ApiResponse.success(
                abTestService.getExperimentResults(experimentKey)));
    }
}
