package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.ReviewResponse;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewModerationService {

    ReviewResponse moderateReview(Long reviewId, String action, String reason);

    Page<ReviewResponse> getPendingReviews(Pageable pageable);

    Page<ReviewResponse> getFlaggedReviews(Pageable pageable);

    ReviewResponse autoModerate(Long reviewId);
}
