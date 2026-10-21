package com.marocloc.marocloc_backend.review.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.review.model.FraudReview;
import com.marocloc.marocloc_backend.review.service.FraudReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.V1 + "/fraud-review")
@RequiredArgsConstructor
public class FraudReviewController {

    private final FraudReviewService fraudReviewService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<FraudReview>>> getPendingReviews(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                fraudReviewService.getPendingReviews(pageable)));
    }

    @PostMapping("/{fraudScoreId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudReview>> submitReview(
            @PathVariable Long fraudScoreId,
            @RequestParam String decision,
            @RequestParam String explanation,
            @RequestParam(defaultValue = "0") Integer reviewTimeSeconds,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = Long.parseLong(userDetails.getUsername());
        FraudReview review = fraudReviewService.submitReview(
                fraudScoreId, adminId, decision, explanation, reviewTimeSeconds);
        return ResponseEntity.ok(ApiResponse.success(review, "Review submitted"));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                fraudReviewService.getReviewDashboardStats()));
    }

    @GetMapping("/explain/{fraudScoreId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExplainability(
            @PathVariable Long fraudScoreId) {
        return ResponseEntity.ok(ApiResponse.success(
                fraudReviewService.getExplainabilityReport(fraudScoreId)));
    }
}
