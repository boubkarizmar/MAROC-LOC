package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.RatingRequest;
import com.marocloc.marocloc_backend.dto.ReviewDTO;
import com.marocloc.marocloc_backend.dto.ReviewResponse;

import java.util.List;

public interface ReviewService {

    ReviewDTO createReview(String userEmail, Long propertyId, ReviewDTO reviewDTO);

    ReviewDTO createReviewWithRatings(String userEmail, Long propertyId, ReviewDTO reviewDTO, RatingRequest ratingRequest);

    List<ReviewResponse> getPropertyReviews(Long propertyId);

    List<ReviewDTO> getUserReviews(String userEmail);

    Double getPropertyAverageRating(Long propertyId);

    void deleteReview(Long reviewId, String userEmail);

    void likeReview(Long reviewId, String userEmail);

    void dislikeReview(Long reviewId, String userEmail);

    void markHelpful(Long reviewId);

    void reportReview(Long reviewId);

    void analyzeReviewSentiment(Long reviewId);

    ReviewDTO updateReview(Long reviewId, ReviewDTO reviewDTO, String userEmail);
}
