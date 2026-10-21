package com.marocloc.marocloc_backend.analytics.controller;

import com.marocloc.marocloc_backend.analytics.dto.AdminAnalyticsDTO;
import com.marocloc.marocloc_backend.analytics.dto.MonthlyPointDTO;
import com.marocloc.marocloc_backend.analytics.dto.YearlyPointDTO;
import com.marocloc.marocloc_backend.analytics.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/analytics/admin")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/platform")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAnalyticsDTO> getPlatformAnalytics() {
        return ResponseEntity.ok(adminAnalyticsService.getPlatformAnalytics());
    }

    @GetMapping("/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MonthlyPointDTO>> getMonthlyAnalytics() {
        return ResponseEntity.ok(adminAnalyticsService.getMonthlyAnalytics());
    }

    @GetMapping("/yearly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<YearlyPointDTO>> getYearlyAnalytics() {
        return ResponseEntity.ok(adminAnalyticsService.getYearlyAnalytics());
    }
}
