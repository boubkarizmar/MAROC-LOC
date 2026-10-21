package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.RatingRequest;
import com.marocloc.marocloc_backend.dto.ReviewDTO;
import com.marocloc.marocloc_backend.dto.ReviewResponse;
import com.marocloc.marocloc_backend.dto.SentimentResponse;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyRating;
import com.marocloc.marocloc_backend.model.Review;
import com.marocloc.marocloc_backend.model.ReviewLike;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import com.marocloc.marocloc_backend.repository.PropertyRatingRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.ReviewLikeRepository;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyRatingRepository propertyRatingRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final AIServiceRestClient aiServiceClient;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ReviewDTO createReview(String userEmail, Long propertyId, ReviewDTO reviewDTO) {
        return createReviewWithRatings(userEmail, propertyId, reviewDTO, null);
    }

    @Override
    @Transactional
    public ReviewDTO createReviewWithRatings(String userEmail, Long propertyId, ReviewDTO reviewDTO, RatingRequest ratingRequest) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property", propertyId));

        // Prevent duplicate reviews
        if (reviewRepository.existsByUserIdAndPropertyId(user.getId(), propertyId)) {
            throw new IllegalStateException("You have already reviewed this property");
        }

        Review review = Review.builder()
                .rating(reviewDTO.getRating())
                .comment(reviewDTO.getComment())
                .user(user)
                .property(property)
                .status(ReviewStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .build();

        // Set multi-dimensional ratings if provided
        if (ratingRequest != null) {
            review.setLocationRating(ratingRequest.getLocation());
            review.setPriceRating(ratingRequest.getPrice());
            review.setCleanlinessRating(ratingRequest.getCleanliness());
            review.setCommunicationRating(ratingRequest.getOwnerCommunication());
            review.setNeighborhoodRating(ratingRequest.getNeighborhood());
            review.setSecurityRating(ratingRequest.getSecurity());
        }

        Review saved = reviewRepository.save(review);

        // Create PropertyRating records for each dimension
        if (ratingRequest != null) {
            createPropertyRating(saved, RatingDimension.LOCATION, ratingRequest.getLocation());
            createPropertyRating(saved, RatingDimension.PRICE, ratingRequest.getPrice());
            createPropertyRating(saved, RatingDimension.CLEANLINESS, ratingRequest.getCleanliness());
            createPropertyRating(saved, RatingDimension.OWNER_COMMUNICATION, ratingRequest.getOwnerCommunication());
            createPropertyRating(saved, RatingDimension.NEIGHBORHOOD, ratingRequest.getNeighborhood());
            createPropertyRating(saved, RatingDimension.SECURITY, ratingRequest.getSecurity());
            createPropertyRating(saved, RatingDimension.OVERALL, reviewDTO.getRating());
        }

        // Analyze sentiment asynchronously if comment exists
        if (saved.getComment() != null && !saved.getComment().isBlank()) {
            try {
                analyzeReviewSentiment(saved.getId());
            } catch (Exception e) {
                log.warn("Sentiment analysis failed for review {}: {}", saved.getId(), e.getMessage());
            }
        }

        User owner = property.getOwner();
        if (owner != null && !owner.getId().equals(user.getId())) {
            notificationService.createFromTemplate(NotificationTemplate.newReview(
                    owner.getId(), user.getId(), propertyId, property.getTitle()));
        }

        log.info("Review {} created for property {} by user {} with ratings", saved.getId(), propertyId, userEmail);

        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public void analyzeReviewSentiment(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        if (review.getComment() == null || review.getComment().isBlank()) {
            return;
        }

        SentimentResponse sentiment = aiServiceClient.analyzeSentiment(review.getComment(), "auto");
        if (sentiment != null) {
            review.setSentimentScore(sentiment.getScore());
            review.setSentimentLabel(sentiment.getLabel());
            review.setSentimentConfidence(sentiment.getConfidence());
            review.setSentimentAnalyzedAt(LocalDateTime.now());
            reviewRepository.save(review);
            log.info("Sentiment analyzed for review {}: {} (score={}, confidence={})",
                    reviewId, sentiment.getLabel(), sentiment.getScore(), sentiment.getConfidence());
        }
    }

    private void createPropertyRating(Review review, RatingDimension dimension, Integer score) {
        if (score != null) {
            PropertyRating pr = PropertyRating.builder()
                    .review(review)
                    .dimension(dimension)
                    .score(score)
                    .build();
            propertyRatingRepository.save(pr);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getPropertyReviews(Long propertyId) {
        return reviewRepository.findByPropertyIdAndStatus(propertyId, ReviewStatus.APPROVED).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getUserReviews(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        return reviewRepository.findByUserIdAndStatus(user.getId(), ReviewStatus.APPROVED).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Double getPropertyAverageRating(Long propertyId) {
        Double avg = reviewRepository.getAverageRatingByPropertyId(propertyId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, String userEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        if (!review.getUser().getEmail().equals(userEmail)) {
            throw new SecurityException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
        log.info("Review {} deleted by user {}", reviewId, userEmail);
    }

    @Override
    @Transactional
    public void likeReview(Long reviewId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", userEmail));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        reviewLikeRepository.findByUserIdAndReviewId(user.getId(), reviewId)
                .ifPresent(like -> {
                    if (Boolean.TRUE.equals(like.getIsLike())) {
                        throw new IllegalStateException("You have already liked this review");
                    }
                    reviewLikeRepository.deleteByUserIdAndReviewId(user.getId(), reviewId);
                    reviewLikeRepository.flush();
                });

        ReviewLike like = ReviewLike.builder()
                .user(user)
                .review(review)
                .isLike(true)
                .build();
        reviewLikeRepository.save(like);
        log.info("Review {} liked by user {}", reviewId, userEmail);
    }

    @Override
    @Transactional
    public void dislikeReview(Long reviewId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", userEmail));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        reviewLikeRepository.findByUserIdAndReviewId(user.getId(), reviewId)
                .ifPresent(like -> {
                    if (Boolean.FALSE.equals(like.getIsLike())) {
                        throw new IllegalStateException("You have already disliked this review");
                    }
                    reviewLikeRepository.deleteByUserIdAndReviewId(user.getId(), reviewId);
                    reviewLikeRepository.flush();
                });

        ReviewLike dislike = ReviewLike.builder()
                .user(user)
                .review(review)
                .isLike(false)
                .build();
        reviewLikeRepository.save(dislike);
        log.info("Review {} disliked by user {}", reviewId, userEmail);
    }

    @Override
    @Transactional
    public void markHelpful(Long reviewId) {
        reviewRepository.incrementHelpfulCount(reviewId);
        log.info("Review {} marked as helpful", reviewId);
    }

    @Override
    @Transactional
    public void reportReview(Long reviewId) {
        reviewRepository.incrementReportCount(reviewId);
        log.info("Review {} reported", reviewId);
    }

    @Override
    @Transactional
    public ReviewDTO updateReview(Long reviewId, ReviewDTO reviewDTO, String userEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        if (!review.getUser().getEmail().equals(userEmail)) {
            throw new SecurityException("You can only update your own reviews");
        }

        review.setRating(reviewDTO.getRating());
        review.setComment(reviewDTO.getComment());
        review.setUpdatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        log.info("Review {} updated by user {}", reviewId, userEmail);
        return mapToDTO(saved);
    }

    private ReviewDTO mapToDTO(Review review) {
        return ReviewDTO.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .propertyId(review.getProperty().getId())
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().toString() : null)
                .build();
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
                .sentimentScore(review.getSentimentScore())
                .sentimentLabel(review.getSentimentLabel())
                .sentimentConfidence(review.getSentimentConfidence())
                .sentimentAnalyzedAt(review.getSentimentAnalyzedAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
