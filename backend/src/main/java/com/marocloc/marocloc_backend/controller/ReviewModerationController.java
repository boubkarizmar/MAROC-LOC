package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ReviewModerationRequest;
import com.marocloc.marocloc_backend.dto.ReviewResponse;
import com.marocloc.marocloc_backend.service.ReviewModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiRoutes.REVIEWS + "/moderation")
@RequiredArgsConstructor
public class ReviewModerationController {

    private final ReviewModerationService reviewModerationService;

    @PostMapping("/action")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> moderateReview(@Valid @RequestBody ReviewModerationRequest request) {
        return ResponseEntity.ok(reviewModerationService.moderateReview(
                request.getReviewId(),
                request.getAction(),
                request.getReason()
        ));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReviewResponse>> getPendingReviews(Pageable pageable) {
        return ResponseEntity.ok(reviewModerationService.getPendingReviews(pageable));
    }

    @GetMapping("/flagged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReviewResponse>> getFlaggedReviews(Pageable pageable) {
        return ResponseEntity.ok(reviewModerationService.getFlaggedReviews(pageable));
    }

    @PostMapping("/auto/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> autoModerate(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewModerationService.autoModerate(reviewId));
    }
}
