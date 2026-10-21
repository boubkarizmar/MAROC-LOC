package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.RecommendationEventRequest;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.model.UserBehavior;
import com.marocloc.marocloc_backend.repository.UserBehaviorRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Event tracking API for recommendation analytics.
 * Tracks impressions, clicks, dismissals, and hover events
 * to measure recommendation quality and improve the model.
 */
@Slf4j
@RestController
@RequestMapping(ApiRoutes.RECOMMENDATIONS + "/events")
@RequiredArgsConstructor
public class RecommendationEventController {

    private final UserBehaviorRepository behaviorRepository;
    private final UserRepository userRepository;

    /**
     * Track a single recommendation event.
     * Works for both authenticated and anonymous users.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> trackEvent(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RecommendationEventRequest request) {

        Long userId = extractUserId(userDetails);
        String behaviorType = mapEventType(request.getEventType());

        UserBehavior behavior = UserBehavior.builder()
                .user(userId != null ? userRepository.findById(userId).orElse(null) : null)
                .behaviorType(behaviorType)
                .entityType("PROPERTY")
                .entityId(request.getPropertyId())
                .metadata(buildMetadata(request))
                .weight(calculateEventWeight(request.getEventType()))
                .sessionId(request.getSessionId())
                .createdAt(LocalDateTime.now())
                .build();

        behaviorRepository.save(behavior);
        log.debug("Tracked recommendation event: {} for property {}", request.getEventType(), request.getPropertyId());

        return ResponseEntity.ok(Map.of("status", "recorded"));
    }

    /**
     * Batch track multiple recommendation events (e.g., impression batch).
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> trackBatchEvents(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RecommendationEventRequest request) {

        Long userId = extractUserId(userDetails);
        var user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        if (request.getBatchEvents() == null || request.getBatchEvents().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No events provided"));
        }

        int count = 0;
        for (var event : request.getBatchEvents()) {
            UserBehavior behavior = UserBehavior.builder()
                    .user(user)
                    .behaviorType(mapEventType(event.getEventType()))
                    .entityType("PROPERTY")
                    .entityId(event.getPropertyId())
                    .metadata(String.format("{\"type\":\"%s\",\"score\":%.1f,\"position\":%d,\"page\":\"%s\"}",
                            event.getRecommendationType(),
                            event.getMatchScore() != null ? event.getMatchScore() : 0.0,
                            event.getPosition() != null ? event.getPosition() : -1,
                            request.getPage() != null ? request.getPage() : "unknown"))
                    .weight(calculateEventWeight(event.getEventType()))
                    .sessionId(request.getSessionId())
                    .createdAt(LocalDateTime.now())
                    .build();
            behaviorRepository.save(behavior);
            count++;
        }

        log.debug("Tracked {} batch recommendation events", count);
        return ResponseEntity.ok(Map.of("status", "recorded", "count", count));
    }

    private String mapEventType(String eventType) {
        return switch (eventType.toUpperCase()) {
            case "IMPRESSION" -> "REC_IMPRESSION";
            case "CLICK" -> "REC_CLICK";
            case "DISMISS" -> "REC_DISMISS";
            case "HOVER" -> "REC_HOVER";
            case "SAVE" -> "REC_SAVE";
            default -> "REC_EVENT";
        };
    }

    private double calculateEventWeight(String eventType) {
        return switch (eventType.toUpperCase()) {
            case "CLICK" -> 3.5;
            case "SAVE" -> 4.5;
            case "DISMISS" -> -2.0;
            case "HOVER" -> 1.0;
            case "IMPRESSION" -> 0.5;
            default -> 1.0;
        };
    }

    private String buildMetadata(RecommendationEventRequest request) {
        return String.format("{\"type\":\"%s\",\"score\":%.1f,\"position\":%d,\"page\":\"%s\"}",
                request.getRecommendationType() != null ? request.getRecommendationType() : "unknown",
                request.getMatchScore() != null ? request.getMatchScore() : 0.0,
                request.getPosition() != null ? request.getPosition() : -1,
                request.getPage() != null ? request.getPage() : "unknown");
    }

    private Long extractUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
