package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CommentDTO;
import com.marocloc.marocloc_backend.dto.ReviewResponse;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.PropertyRating;
import com.marocloc.marocloc_backend.model.Review;
import com.marocloc.marocloc_backend.model.ReviewLike;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import com.marocloc.marocloc_backend.repository.PropertyRatingRepository;
import com.marocloc.marocloc_backend.repository.ReviewLikeRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewModerationServiceImpl implements ReviewModerationService {

    private final ReviewRepository reviewRepository;
    private final PropertyRatingRepository propertyRatingRepository;
    private final ReviewLikeRepository reviewLikeRepository;

    @Override
    @Transactional
    public ReviewResponse moderateReview(Long reviewId, String action, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        ReviewStatus newStatus = switch (action.toUpperCase()) {
            case "APPROVE" -> ReviewStatus.APPROVED;
            case "REJECT" -> ReviewStatus.REJECTED;
            case "FLAG" -> ReviewStatus.FLAGGED;
            case "UNFLAG" -> ReviewStatus.APPROVED;
            case "HIDE" -> ReviewStatus.HIDDEN;
            default -> throw new IllegalArgumentException("Invalid moderation action: " + action);
        };

        review.setStatus(newStatus);
        Review saved = reviewRepository.save(review);

        log.info("Review {} moderated to {} by admin. Reason: {}", reviewId, newStatus, reason);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByStatus(ReviewStatus.PENDING, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getFlaggedReviews(Pageable pageable) {
        return reviewRepository.findByStatus(ReviewStatus.FLAGGED, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ReviewResponse autoModerate(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        // Simple heuristics for auto-moderation
        boolean shouldFlag = false;
        String comment = review.getComment();

        if (comment != null) {
            // Check for excessive caps
            long capsCount = comment.chars().filter(Character::isUpperCase).count();
            if (capsCount > comment.length() * 0.7 && comment.length() > 20) {
                shouldFlag = true;
            }

            // Check for repeated characters
            if (comment.matches(".*(.)\\1{4,}.*")) {
                shouldFlag = true;
            }

            // Check for common spam patterns
            String lower = comment.toLowerCase();
            if (lower.contains("http://") || lower.contains("https://") || lower.contains("www.")) {
                shouldFlag = true;
            }
        }

        if (shouldFlag) {
            review.setStatus(ReviewStatus.FLAGGED);
            log.info("Review {} auto-flagged by moderation system", reviewId);
        } else {
            review.setStatus(ReviewStatus.APPROVED);
            log.info("Review {} auto-approved by moderation system", reviewId);
        }

        return mapToResponse(reviewRepository.save(review));
    }

    private ReviewResponse mapToResponse(Review review) {
        Long likeCount = reviewLikeRepository.countLikesByReviewId(review.getId());
        Long dislikeCount = reviewLikeRepository.countDislikesByReviewId(review.getId());

        Map<RatingDimension, Integer> ratings = new EnumMap<>(RatingDimension.class);
        List<PropertyRating> propertyRatings = propertyRatingRepository.findByReviewId(review.getId());
        for (PropertyRating pr : propertyRatings) {
            ratings.put(pr.getDimension(), pr.getScore());
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .propertyId(review.getProperty().getId())
                .isVerified(review.getIsVerified())
                .status(review.getStatus().name())
                .helpfulCount(review.getHelpfulCount())
                .reportCount(review.getReportCount())
                .likeCount(likeCount != null ? likeCount : 0L)
                .dislikeCount(dislikeCount != null ? dislikeCount : 0L)
                .ratings(ratings)
                .comments(new ArrayList<>())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
