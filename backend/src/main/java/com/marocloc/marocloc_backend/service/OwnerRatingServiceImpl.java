package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.OwnerRatingDTO;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.OwnerRating;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.OwnerRatingRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OwnerRatingServiceImpl implements OwnerRatingService {

    private final OwnerRatingRepository ownerRatingRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    @Override
    @Transactional
    public OwnerRatingDTO getOwnerRating(Long userId) {
        OwnerRating rating = ownerRatingRepository.findByUserId(userId)
                .orElseGet(() -> {
                    recalculateOwnerRating(userId);
                    return ownerRatingRepository.findByUserId(userId)
                            .orElseThrow(() -> new NotFoundException("Owner rating not found for user", userId));
                });
        return mapToDTO(rating);
    }

    @Override
    @Transactional
    public void recalculateOwnerRating(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User", userId));

        if (user.getRole() != Role.PROPRIETAIRE) {
            return;
        }

        Double avgRating = reviewRepository.getAverageRatingByOwnerId(userId);
        if (avgRating == null) avgRating = 0.0;

        Long reviewCount = reviewRepository.countByOwnerIdAndStatusApproved(userId);
        if (reviewCount == null) reviewCount = 0L;
        Integer propertyCount = user.getProperties() != null ? user.getProperties().size() : 0;

        double overallScore = Math.min(100.0, avgRating * 20.0);
        double trustScore = Math.min(100.0, reviewCount * 5.0 + 20.0);
        double professionalismScore = Math.min(100.0, avgRating * 18.0 + 10.0);
        double propertyQualityScore = Math.min(100.0, avgRating * 20.0);

        OwnerRating rating = ownerRatingRepository.findByUserId(userId)
                .orElse(OwnerRating.builder().user(user).build());

        rating.setOverallScore(overallScore);
        rating.setTrustScore(trustScore);
        rating.setProfessionalismScore(professionalismScore);
        rating.setPropertyQualityScore(propertyQualityScore);
        rating.setResponseSpeedScore(50.0);
        rating.setTotalReviews(reviewCount.intValue());
        rating.setTotalProperties(propertyCount);
        rating.setResponseRate(75.0);
        rating.setAvgResponseHours(4.0);

        ownerRatingRepository.save(rating);
        log.info("Owner rating recalculated for user {}", userId);
    }

    private OwnerRatingDTO mapToDTO(OwnerRating rating) {
        return OwnerRatingDTO.builder()
                .userId(rating.getUser().getId())
                .userName(rating.getUser().getName())
                .overallScore(rating.getOverallScore())
                .responseSpeedScore(rating.getResponseSpeedScore())
                .trustScore(rating.getTrustScore())
                .professionalismScore(rating.getProfessionalismScore())
                .propertyQualityScore(rating.getPropertyQualityScore())
                .totalReviews(rating.getTotalReviews())
                .totalProperties(rating.getTotalProperties())
                .responseRate(rating.getResponseRate())
                .avgResponseHours(rating.getAvgResponseHours())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }
}
