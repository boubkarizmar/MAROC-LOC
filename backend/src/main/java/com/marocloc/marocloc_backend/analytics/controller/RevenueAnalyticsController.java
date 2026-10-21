package com.marocloc.marocloc_backend.analytics.controller;

import com.marocloc.marocloc_backend.analytics.dto.RevenueAnalyticsDTO;
import com.marocloc.marocloc_backend.analytics.service.RevenueAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/analytics/revenue")
@RequiredArgsConstructor
public class RevenueAnalyticsController {

    private final RevenueAnalyticsService revenueAnalyticsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RevenueAnalyticsDTO> getRevenueAnalytics(
            @RequestParam(defaultValue = "2026-05") String period) {
        return ResponseEntity.ok(revenueAnalyticsService.getRevenueAnalytics(period));
    }

    @GetMapping("/cohorts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCohortAnalysis(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(revenueAnalyticsService.getCohortAnalysis(months));
    }
}
