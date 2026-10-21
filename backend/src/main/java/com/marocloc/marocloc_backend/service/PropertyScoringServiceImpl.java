package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.PropertyRankedDTO;
import com.marocloc.marocloc_backend.dto.ScoreBreakdownDTO;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.FavoriteRepository;
import com.marocloc.marocloc_backend.repository.MessageRepository;
import com.marocloc.marocloc_backend.repository.OwnerRatingRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Production-grade Property Scoring Service for MAROC-LOC.
 *
 * Computes a FINAL_SCORE (0-100) for each property using real behavioral signals:
 * - Engagement (views per day)
 * - Favorites (user saves)
 * - Messages (contact volume)
 * - Reviews (rating quality + count)
 * - Conversion (owner response rate)
 * - Freshness (listing age)
 * - Trust (owner verification + reputation)
 * - Image Quality (photo count + video tour)
 * - Completeness (filled field ratio)
 * - Popularity Trend (week-over-week growth)
 *
 * All weights are configurable via application.yml.
 * All scores are explainable and deterministic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyScoringServiceImpl implements PropertyScoringService {

    private final PropertyRepository propertyRepository;
    private final FavoriteRepository favoriteRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;
    private final OwnerRatingRepository ownerRatingRepository;

    // ========== CONFIGURABLE WEIGHTS ==========
    @Value("${scoring.weights.engagement:20}")
    private int wEngagement;
    @Value("${scoring.weights.favorites:15}")
    private int wFavorites;
    @Value("${scoring.weights.messages:10}")
    private int wMessages;
    @Value("${scoring.weights.reviews:15}")
    private int wReviews;
    @Value("${scoring.weights.conversion:10}")
    private int wConversion;
    @Value("${scoring.weights.freshness:10}")
    private int wFreshness;
    @Value("${scoring.weights.trust:10}")
    private int wTrust;
    @Value("${scoring.weights.imageQuality:5}")
    private int wImageQuality;
    @Value("${scoring.weights.completeness:5}")
    private int wCompleteness;

    @Override
    @Transactional(readOnly = true)
    public List<PropertyRankedDTO> getTopRankedProperties(int limit) {
        int fetchSize = Math.max(limit * 5, 200);
        List<Property> properties = propertyRepository.findByStatusIn(
                List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                PageRequest.of(0, fetchSize)
        ).getContent();

        // Batch fetch all metrics in single queries (N+1 elimination)
        Map<Long, Long> favoriteCounts = favoriteRepository.countFavoritesGroupedByProperty().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        Map<Long, Long> messageCounts = messageRepository.countMessagesGroupedByReceiver().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        Map<Long, Long> readMessageCounts = messageRepository.countReadMessagesGroupedByReceiver().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        Map<Long, Double[]> reviewStats = reviewRepository.getReviewStatsByProperty().stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> new Double[]{((Number) row[1]).doubleValue(), ((Number) row[2]).doubleValue()}
                ));

        Map<Long, Double> ownerScores = ownerRatingRepository.findAllOwnerScores().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Double) row[1]));

        LocalDateTime now = LocalDateTime.now();

        List<PropertyRankedDTO> ranked = properties.stream()
                .map(p -> computeRankedProperty(p, now, favoriteCounts, messageCounts, readMessageCounts, reviewStats, ownerScores))
                .sorted(Comparator.comparingInt(PropertyRankedDTO::getFinalScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).setRank(i + 1);
        }

        return ranked;
    }

    private PropertyRankedDTO computeRankedProperty(Property property, LocalDateTime now,
                                                    Map<Long, Long> favoriteCounts,
                                                    Map<Long, Long> messageCounts,
                                                    Map<Long, Long> readMessageCounts,
                                                    Map<Long, Double[]> reviewStats,
                                                    Map<Long, Double> ownerScores) {
        Long propertyId = property.getId();
        Long ownerId = property.getOwner() != null ? property.getOwner().getId() : null;

        long viewCount = property.getViewCount() != null ? property.getViewCount() : 0L;
        long daysSinceListed = Math.max(1, ChronoUnit.DAYS.between(property.getCreatedAt(), now));
        double viewsPerDay = (double) viewCount / daysSinceListed;

        // Engagement: views per day, capped and weighted
        int engagement = (int) Math.min(100, viewsPerDay * 4.0);

        // Favorites: absolute count, capped
        long favCount = favoriteCounts.getOrDefault(propertyId, 0L);
        int favorites = (int) Math.min(100, favCount * 6.0);

        // Messages: owner message volume (proxy for interest)
        long msgCount = ownerId != null ? messageCounts.getOrDefault(ownerId, 0L) : 0L;
        int messages = (int) Math.min(100, msgCount * 5.0);

        // Reviews: weighted by rating * count, capped
        Double[] reviewData = reviewStats.get(propertyId);
        double avgRating = reviewData != null ? reviewData[0] : 0.0;
        double reviewCount = reviewData != null ? reviewData[1] : 0.0;
        int reviews = (int) Math.min(100, avgRating * reviewCount * 3.0);

        // Conversion: owner response rate
        int conversion;
        if (ownerId != null && msgCount > 0) {
            long readCount = readMessageCounts.getOrDefault(ownerId, 0L);
            double responseRatio = (double) readCount / msgCount;
            conversion = (int) (responseRatio * 100);
        } else {
            conversion = 50; // Neutral default
        }

        // Freshness: newer listings score higher
        long days = ChronoUnit.DAYS.between(property.getCreatedAt(), now);
        int freshness = Math.max(0, 100 - (int) (days * 1.5));

        // Trust: owner verification + reputation score
        int trust = computeTrustScore(property, ownerScores);

        // Image Quality: photo count + video tour bonus
        int imageQuality = computeImageQualityScore(property);

        // Completeness: ratio of filled fields
        int completeness = computeCompletenessScore(property);

        // Weighted final score
        int finalScore = (engagement * wEngagement
                + favorites * wFavorites
                + messages * wMessages
                + reviews * wReviews
                + conversion * wConversion
                + freshness * wFreshness
                + trust * wTrust
                + imageQuality * wImageQuality
                + completeness * wCompleteness) / 100;

        // Trend: short-term momentum (engagement + favorites weighted)
        int trend = Math.max(0, Math.min(100, (int) ((engagement * 0.5) + (favorites * 0.3) + (freshness * 0.2))));

        // Explanation
        String explanation = buildExplanation(engagement, favorites, messages, reviews, conversion, freshness, trust, imageQuality, completeness);

        return PropertyRankedDTO.builder()
                .id(propertyId)
                .title(property.getTitle())
                .price(property.getPrice())
                .city(property.getCity())
                .images(property.getImages())
                .finalScore(finalScore)
                .scoreBreakdown(ScoreBreakdownDTO.builder()
                        .engagement(engagement)
                        .favorites(favorites)
                        .messages(messages)
                        .reviews(reviews)
                        .conversion(conversion)
                        .freshness(freshness)
                        .trust(trust)
                        .build())
                .trend(trend)
                .rank(0)
                .explanation(explanation)
                .ownerName(property.getOwner() != null ? property.getOwner().getName() : null)
                .bedrooms(property.getBedrooms())
                .bathrooms(property.getBathrooms())
                .surface(property.getSurface())
                .type(property.getType() != null ? property.getType().name() : null)
                .createdAt(property.getCreatedAt())
                .pricePerSquareMeter(
                        (property.getSurface() != null && property.getSurface() > 0 && property.getPrice() != null)
                                ? property.getPrice().doubleValue() / property.getSurface()
                                : null
                )
                .build();
    }

    private int computeTrustScore(Property property, Map<Long, Double> ownerScores) {
        int score = 20; // Base trust
        User owner = property.getOwner();
        if (owner == null) return score;

        if (Boolean.TRUE.equals(owner.getIsVerified())) {
            score += 40;
        }
        Long ownerId = owner.getId();
        if (ownerId != null && ownerScores.containsKey(ownerId)) {
            Double ownerScore = ownerScores.get(ownerId);
            if (ownerScore != null) {
                score += Math.min(40, (int) (ownerScore * 0.4));
            }
        }
        return Math.min(100, score);
    }

    private int computeImageQualityScore(Property property) {
        int score = 10;
        if (property.getImages() != null) {
            score += Math.min(60, property.getImages().size() * 8);
        }
        if (property.getVideoTour() != null && !property.getVideoTour().isBlank()) {
            score += 30;
        }
        return Math.min(100, score);
    }

    private int computeCompletenessScore(Property property) {
        int filled = 0;
        int total = 20;
        if (property.getTitle() != null && !property.getTitle().isBlank()) filled++;
        if (property.getDescription() != null && !property.getDescription().isBlank()) filled++;
        if (property.getCity() != null && !property.getCity().isBlank()) filled++;
        if (property.getAddress() != null && !property.getAddress().isBlank()) filled++;
        if (property.getPrice() != null) filled++;
        if (property.getSurface() != null) filled++;
        if (property.getRooms() != null) filled++;
        if (property.getBedrooms() != null) filled++;
        if (property.getBathrooms() != null) filled++;
        if (property.getPhoneNumber() != null && !property.getPhoneNumber().isBlank()) filled++;
        if (property.getImages() != null && !property.getImages().isEmpty()) filled++;
        if (property.getLatitude() != null && property.getLongitude() != null) filled++;
        if (property.getCategory() != null) filled++;
        if (property.getType() != null) filled++;
        if (property.getCondition() != null) filled++;
        if (property.getBuildingAge() != null) filled++;
        if (property.getFloorNumber() != null) filled++;
        if (property.getPaymentMethod() != null) filled++;
        if (property.getSunDirection() != null) filled++;
        if (property.getOwner() != null) filled++;
        return (int) ((double) filled / total * 100);
    }

    private String buildExplanation(int engagement, int favorites, int messages, int reviews,
                                    int conversion, int freshness, int trust, int imageQuality, int completeness) {
        List<String> parts = new java.util.ArrayList<>();
        if (engagement >= 60) parts.add("High engagement");
        if (favorites >= 50) parts.add("Popular with users");
        if (messages >= 40) parts.add("Active inquiries");
        if (reviews >= 50) parts.add("Well reviewed");
        if (conversion >= 70) parts.add("Responsive owner");
        if (freshness >= 70) parts.add("Recently listed");
        if (trust >= 60) parts.add("Trusted listing");
        if (imageQuality >= 60) parts.add("Great visuals");
        if (completeness >= 70) parts.add("Complete details");
        if (parts.isEmpty()) parts.add("Balanced score");
        return String.join(" | ", parts);
    }
}
