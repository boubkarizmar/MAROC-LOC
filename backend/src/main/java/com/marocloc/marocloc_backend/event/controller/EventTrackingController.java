package com.marocloc.marocloc_backend.event.controller;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.event.dto.TrackEventRequest;
import com.marocloc.marocloc_backend.event.service.EventTrackingService;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping(ApiRoutes.EVENTS)
@RequiredArgsConstructor
public class EventTrackingController {

    private final EventTrackingService eventTrackingService;
    private final UserRepository userRepository;

    @PostMapping("/track")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> trackEvent(
            @Valid @RequestBody TrackEventRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {

        Long userId = null;
        if (userDetails != null) {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
            userId = user != null ? user.getId() : null;
        }

        eventTrackingService.trackEvent(request, userId, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(null, "Événement enregistré"));
    }

    @GetMapping("/analytics/top-properties")
    @PreAuthorize("hasAnyRole('ADMIN','PROPRIETAIRE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopViewedProperties(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                eventTrackingService.getTopViewedProperties(days, limit)));
    }

    @GetMapping("/analytics/top-searches")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopSearchQueries(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                eventTrackingService.getTopSearchQueries(days, limit)));
    }

    @GetMapping("/analytics/engagement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEngagementSummary(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success(
                eventTrackingService.getEngagementSummary(days)));
    }
}
