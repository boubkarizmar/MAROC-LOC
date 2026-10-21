package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.PlatformReviewStatsDTO;
import com.marocloc.marocloc_backend.dto.RatingRequest;
import com.marocloc.marocloc_backend.dto.ReviewDTO;
import com.marocloc.marocloc_backend.dto.ReviewWithRatingsRequest;
import com.marocloc.marocloc_backend.dto.ReviewResponse;
import com.marocloc.marocloc_backend.dto.VerifiedReviewDTO;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import com.marocloc.marocloc_backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping(ApiRoutes.REVIEWS)
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;

    @PostMapping("/property/{propertyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDTO> createReview(
            @PathVariable Long propertyId,
            @Valid @RequestBody ReviewDTO reviewDTO,
            @AuthenticationPrincipal UserDetails userDetails) {

        ReviewDTO created = reviewService.createReview(
                userDetails.getUsername(),
                propertyId,
                reviewDTO
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/property/{propertyId}/with-ratings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDTO> createReviewWithRatings(
            @PathVariable Long propertyId,
            @Valid @RequestBody ReviewWithRatingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ReviewDTO created = reviewService.createReviewWithRatings(
                userDetails.getUsername(),
                propertyId,
                request.getReview(),
                request.getRatings()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<ReviewResponse>> getPropertyReviews(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.getPropertyReviews(propertyId));
    }

    @GetMapping("/property/{propertyId}/average")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long propertyId) {
        Double avg = reviewService.getPropertyAverageRating(propertyId);
        return ResponseEntity.ok(avg != null ? avg : 0.0);
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ReviewDTO>> getMyReviews(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(reviewService.getUserReviews(userDetails.getUsername()));
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        reviewService.deleteReview(reviewId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reviewId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> likeReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        reviewService.likeReview(reviewId, userDetails.getUsername());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Review liked successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{reviewId}/dislike")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> dislikeReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        reviewService.dislikeReview(reviewId, userDetails.getUsername());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Review disliked successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{reviewId}/helpful")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markHelpful(@PathVariable Long reviewId) {
        reviewService.markHelpful(reviewId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Review marked as helpful");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{reviewId}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> reportReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        reviewService.reportReview(reviewId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Review reported successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{reviewId}/analyze-sentiment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> analyzeSentiment(@PathVariable Long reviewId) {
        reviewService.analyzeReviewSentiment(reviewId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Sentiment analysis completed");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewDTO reviewDTO,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, reviewDTO, userDetails.getUsername()));
    }

    @GetMapping("/verified")
    public ResponseEntity<List<VerifiedReviewDTO>> getVerifiedReviews() {
        Pageable pageable = PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "helpfulCount", "createdAt"));
        var reviews = reviewRepository.findVerifiedReviews(ReviewStatus.APPROVED, pageable);
        List<VerifiedReviewDTO> result = reviews.stream()
                .map(r -> VerifiedReviewDTO.builder()
                        .id(r.getId())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .userName(r.getUser().getName())
                        .userAvatar(null)
                        .city(r.getProperty().getCity())
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/platform-stats")
    public ResponseEntity<PlatformReviewStatsDTO> getPlatformReviewStats() {
        Double averageRating = reviewRepository.getAverageRatingOfApprovedReviews();
        Long totalReviews = reviewRepository.countByStatus(ReviewStatus.APPROVED);
        List<Object[]> distributionRows = reviewRepository.getApprovedRatingDistribution();

        Map<Integer, Long> distribution = new java.util.HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }
        for (Object[] row : distributionRows) {
            Integer rating = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            distribution.put(rating, count);
        }

        return ResponseEntity.ok(PlatformReviewStatsDTO.builder()
                .averageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .distribution(distribution)
                .build());
    }
}
