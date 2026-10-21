package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.UserProfileReviewDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserProfileReviewService {

    UserProfileReviewDTO createReview(String authorEmail, Long targetUserId, Integer rating, String comment);

    Page<UserProfileReviewDTO> getReviewsForUser(Long targetUserId, Pageable pageable);

    Page<UserProfileReviewDTO> getReviewsByUser(String authorEmail, Pageable pageable);

    Double getUserAverageRating(Long userId);

    void deleteReview(Long reviewId, String userEmail);
}
