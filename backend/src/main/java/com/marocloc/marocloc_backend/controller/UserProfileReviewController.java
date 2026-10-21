package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.UserProfileReviewDTO;
import com.marocloc.marocloc_backend.service.UserProfileReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.REVIEWS + "/user-profile")
@RequiredArgsConstructor
public class UserProfileReviewController {

    private final UserProfileReviewService userProfileReviewService;

    @PostMapping("/target/{targetUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileReviewDTO> createReview(
            @PathVariable Long targetUserId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String comment,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userProfileReviewService.createReview(
                        userDetails.getUsername(), targetUserId, rating, comment));
    }

    @GetMapping("/target/{targetUserId}")
    public ResponseEntity<Page<UserProfileReviewDTO>> getReviewsForUser(
            @PathVariable Long targetUserId,
            Pageable pageable) {

        return ResponseEntity.ok(userProfileReviewService.getReviewsForUser(targetUserId, pageable));
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<UserProfileReviewDTO>> getMyReviews(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {

        return ResponseEntity.ok(userProfileReviewService.getReviewsByUser(userDetails.getUsername(), pageable));
    }

    @GetMapping("/target/{targetUserId}/average")
    public ResponseEntity<Map<String, Double>> getUserAverageRating(@PathVariable Long targetUserId) {
        Double avg = userProfileReviewService.getUserAverageRating(targetUserId);
        Map<String, Double> response = new HashMap<>();
        response.put("averageRating", avg);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        userProfileReviewService.deleteReview(reviewId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
