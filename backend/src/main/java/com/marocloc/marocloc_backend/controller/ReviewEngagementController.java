package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.OwnerRatingDTO;
import com.marocloc.marocloc_backend.dto.ReviewEngagementResponse;
import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import com.marocloc.marocloc_backend.service.OwnerRatingService;
import com.marocloc.marocloc_backend.service.ReviewEngagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.REVIEWS)
@RequiredArgsConstructor
public class ReviewEngagementController {

    private final ReviewEngagementService reviewEngagementService;
    private final OwnerRatingService ownerRatingService;

    @GetMapping("/property/{propertyId}/engagement")
    public ResponseEntity<ReviewEngagementResponse> getPropertyEngagement(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewEngagementService.computePropertyRatingSummary(propertyId));
    }

    @GetMapping("/property/{propertyId}/distribution")
    public ResponseEntity<Map<Integer, Long>> getRatingDistribution(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewEngagementService.getRatingDistribution(propertyId));
    }

    @GetMapping("/property/{propertyId}/dimensions")
    public ResponseEntity<Map<RatingDimension, Double>> getDimensionAverages(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewEngagementService.computeDimensionAverages(propertyId));
    }

    @GetMapping("/owner/{ownerId}/reputation")
    public ResponseEntity<OwnerRatingDTO> getOwnerReputation(@PathVariable Long ownerId) {
        return ResponseEntity.ok(ownerRatingService.getOwnerRating(ownerId));
    }
}
