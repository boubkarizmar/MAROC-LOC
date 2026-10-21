package com.marocloc.marocloc_backend.analytics.controller;

import com.marocloc.marocloc_backend.analytics.dto.TimeSeriesPointDTO;
import com.marocloc.marocloc_backend.analytics.service.EngagementChartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/analytics/charts")
@RequiredArgsConstructor
public class EngagementChartController {

    private final EngagementChartService engagementChartService;

    @GetMapping("/dau")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimeSeriesPointDTO>> getDailyActiveUsers(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(engagementChartService.getDailyActiveUsers(days).getDataPoints());
    }

    @GetMapping("/property-views")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimeSeriesPointDTO>> getPropertyViewsTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(engagementChartService.getPropertyViewsTrend(days).getDataPoints());
    }

    @GetMapping("/searches")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimeSeriesPointDTO>> getSearchTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(engagementChartService.getSearchTrend(days).getDataPoints());
    }

    @GetMapping("/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimeSeriesPointDTO>> getMessageVolumeTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(engagementChartService.getMessageVolumeTrend(days).getDataPoints());
    }

    @GetMapping("/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimeSeriesPointDTO>> getReviewTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(engagementChartService.getReviewTrend(days).getDataPoints());
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TimeSeriesPointDTO>> getRevenueTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(engagementChartService.getRevenueTrend(days).getDataPoints());
    }
}
