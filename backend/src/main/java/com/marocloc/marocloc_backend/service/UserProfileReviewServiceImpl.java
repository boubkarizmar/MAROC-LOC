package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.UserProfileReviewDTO;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.model.UserProfileReview;
import com.marocloc.marocloc_backend.repository.UserProfileReviewRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileReviewServiceImpl implements UserProfileReviewService {

    private final UserProfileReviewRepository userProfileReviewRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserProfileReviewDTO createReview(String authorEmail, Long targetUserId, Integer rating, String comment) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new NotFoundException("User", authorEmail));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("User", targetUserId));

        if (author.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot review yourself");
        }

        if (userProfileReviewRepository.existsByAuthorIdAndTargetUserId(author.getId(), targetUserId)) {
            throw new IllegalStateException("You have already reviewed this user");
        }

        UserProfileReview review = UserProfileReview.builder()
                .author(author)
                .targetUser(targetUser)
                .rating(rating)
                .comment(comment)
                .status(ReviewStatus.APPROVED)
                .build();

        UserProfileReview saved = userProfileReviewRepository.save(review);
        log.info("User profile review {} created by {} for {}", saved.getId(), authorEmail, targetUser.getEmail());
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserProfileReviewDTO> getReviewsForUser(Long targetUserId, Pageable pageable) {
        return userProfileReviewRepository.findByTargetUserIdAndStatus(targetUserId, ReviewStatus.APPROVED, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserProfileReviewDTO> getReviewsByUser(String authorEmail, Pageable pageable) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new NotFoundException("User", authorEmail));
        return userProfileReviewRepository.findByAuthorIdAndStatus(author.getId(), ReviewStatus.APPROVED, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getUserAverageRating(Long userId) {
        Double avg = userProfileReviewRepository.getAverageRatingByTargetUserId(userId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", userEmail));
        UserProfileReview review = userProfileReviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review", reviewId));

        if (!review.getAuthor().getId().equals(user.getId()) && user.getRole() != com.marocloc.marocloc_backend.model.Role.ADMIN) {
            throw new SecurityException("You can only delete your own reviews");
        }

        userProfileReviewRepository.delete(review);
        log.info("User profile review {} deleted by {}", reviewId, userEmail);
    }

    private UserProfileReviewDTO mapToDTO(UserProfileReview review) {
        return UserProfileReviewDTO.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .targetUserId(review.getTargetUser().getId())
                .targetUserName(review.getTargetUser().getName())
                .authorId(review.getAuthor().getId())
                .authorName(review.getAuthor().getName())
                .status(review.getStatus().name())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
