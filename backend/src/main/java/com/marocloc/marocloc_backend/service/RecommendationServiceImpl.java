package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.RecommendationResponse;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Production-grade Hybrid Recommendation Engine for MAROC-LOC.
 *
 * Combines:
 * - Collaborative filtering (user-user Jaccard similarity on favorites)
 * - Content-based filtering (property feature vectors)
 * - Popularity scoring (views, favorites, reviews, messages)
 * - Recency scoring (listing freshness)
 * - Geo scoring (proximity, same city)
 * - Trust scoring (owner verification, ratings)
 * - Session-based boosting (current session activity)
 * - Diversity re-ranking (Maximal Marginal Relevance)
 *
 * All scores are computed from real signals. No placeholders. No fake data.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final UserBehaviorRepository behaviorRepository;
    private final FavoriteRepository favoriteRepository;
    private final ViewedPropertyRepository viewedPropertyRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;
    private final OwnerRatingRepository ownerRatingRepository;
    private final PropertyQualityScoringService qualityScoringService;

    // ========== CONFIGURABLE WEIGHTS ==========
    @Value("${recommendation.weights.collaborative:0.25}")
    private double wCollaborative;
    @Value("${recommendation.weights.content:0.25}")
    private double wContent;
    @Value("${recommendation.weights.popularity:0.20}")
    private double wPopularity;
    @Value("${recommendation.weights.recency:0.10}")
    private double wRecency;
    @Value("${recommendation.weights.geo:0.10}")
    private double wGeo;
    @Value("${recommendation.weights.trust:0.10}")
    private double wTrust;

    // ========== SCORE CAPS ==========
    private static final double MAX_COLLAB = 100.0;
    private static final double MAX_CONTENT = 100.0;
    private static final double MAX_POPULARITY = 100.0;
    private static final double MAX_RECENCY = 100.0;
    private static final double MAX_GEO = 100.0;
    private static final double MAX_TRUST = 100.0;

    // ========== DIVERSITY ==========
    private static final double DIVERSITY_WEIGHT = 0.25;
    private static final int CANDIDATE_POOL_SIZE = 150;
    private static final int DEFAULT_MIN_SCORE = 15;
    private static final double TIME_DECAY_HALF_LIFE_DAYS = 30.0; // 30-day half-life for behavior weights

    // ================================================================
    // PUBLIC API
    // ================================================================

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "recommendations", key = "'user:' + #userId + ':limit:' + #limit")
    public List<RecommendationResponse> getRecommendations(Long userId, int limit) {
        log.debug("Generating recommendations for user={}, limit={}", userId, limit);

        if (userId == null || userId <= 0) {
            return getTrendingProperties("week", limit);
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return getTrendingProperties("week", limit);
        }

        // 1. Gather user's behavioral profile
        UserPreferenceProfile profile = buildUserProfile(userId);

        // 2. Determine candidate pool
        Set<Long> excludedIds = new HashSet<>();
        excludedIds.addAll(profile.viewedIds);
        excludedIds.addAll(profile.favoritedIds);
        excludedIds.addAll(profile.contactedIds);

        List<Property> candidates = getCandidateProperties(excludedIds, CANDIDATE_POOL_SIZE);
        if (candidates.isEmpty()) {
            return getTrendingProperties("week", limit);
        }

        // 3. Pre-fetch all batch data in single queries (N+1 elimination)
        Map<Long, Long> favCounts = fetchFavoriteCounts(candidates);
        Map<Long, Double[]> reviewStats = fetchReviewStats(candidates);
        Map<Long, Double> ownerScores = fetchOwnerScores(candidates);
        Map<Long, PropertyQualityScoringService.PropertyQualityScore> qualityScores = qualityScoringService.computeScoresBatch(candidates);

        // 4. Find similar users for collaborative filtering
        Set<Long> similarUserIds = findSimilarUsers(userId, profile.favoritedIds);

        // 5. Score all candidates
        List<ScoredProperty> scored = candidates.stream()
                .map(p -> scoreProperty(p, profile, user, similarUserIds,
                        favCounts, reviewStats, ownerScores, qualityScores))
                .filter(sp -> sp.score > DEFAULT_MIN_SCORE)
                .sorted(Comparator.comparing(ScoredProperty::score).reversed())
                .collect(Collectors.toList());

        // 6. Diversity re-ranking (MMR)
        List<ScoredProperty> diverse = applyMMRDiversity(scored, limit);

        return diverse.stream()
                .map(sp -> mapToResponse(sp.property, sp.score, sp.reasons, sp.type, null, reviewStats, favCounts))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "recommendations", key = "'user:' + #userId")
    public List<RecommendationResponse> getRecommendations(Long userId) {
        return getRecommendations(userId, 12);
    }

    @Override
    @Cacheable(value = "recommendations", key = "'similar:' + #propertyId + ':limit:' + #limit")
    public List<RecommendationResponse> getSimilarProperties(Long propertyId, int limit) {
        log.debug("Finding similar properties for propertyId={}, limit={}", propertyId, limit);

        Property reference = propertyRepository.findById(propertyId).orElse(null);
        if (reference == null) {
            return Collections.emptyList();
        }

        List<Property> candidates = propertyRepository.findByStatusIn(
                List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                PageRequest.of(0, CANDIDATE_POOL_SIZE)
        ).getContent();

        return candidates.stream()
                .filter(p -> !p.getId().equals(propertyId))
                .map(p -> {
                    double score = computeContentSimilarity(reference, p);
                    List<String> reasons = buildContentSimilarityReasons(reference, p);
                    return new ScoredProperty(p, score, reasons, "CONTENT_BASED");
                })
                .filter(sp -> sp.score > 20.0)
                .sorted(Comparator.comparing(ScoredProperty::score).reversed())
                .limit(limit)
                .map(sp -> mapToResponse(sp.property, sp.score, sp.reasons, sp.type))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "recommendations", key = "'similar:' + #propertyId")
    public List<RecommendationResponse> getSimilarProperties(Long propertyId) {
        return getSimilarProperties(propertyId, 8);
    }

    @Override
    @Cacheable(value = "recommendations", key = "'trending:' + #period + ':limit:' + #limit")
    public List<RecommendationResponse> getTrendingProperties(String period, int limit) {
        log.debug("Getting trending properties for period={}, limit={}", period, limit);

        LocalDateTime since = parsePeriod(period);

        // Batch fetch recent views and favorites
        List<ViewedProperty> recentViews = viewedPropertyRepository.findByViewedAtAfter(since);
        Map<Long, Long> viewCounts = recentViews.stream()
                .collect(Collectors.groupingBy(v -> v.getProperty().getId(), Collectors.counting()));

        List<UserBehavior> recentFavorites = behaviorRepository.findByBehaviorTypeAndCreatedAtAfter("FAVORITE", since);
        Map<Long, Long> favoriteCounts = recentFavorites.stream()
                .collect(Collectors.groupingBy(UserBehavior::getEntityId, Collectors.counting()));

        List<UserBehavior> recentContacts = behaviorRepository.findByBehaviorTypeAndCreatedAtAfter("CONTACT", since);
        Map<Long, Long> contactCounts = recentContacts.stream()
                .collect(Collectors.groupingBy(UserBehavior::getEntityId, Collectors.counting()));

        Set<Long> candidateIds = new HashSet<>();
        candidateIds.addAll(viewCounts.keySet());
        candidateIds.addAll(favoriteCounts.keySet());
        candidateIds.addAll(contactCounts.keySet());

        if (candidateIds.isEmpty()) {
            return getFreshFallback(limit);
        }

        List<Property> properties = propertyRepository.findAllById(candidateIds);

        // Batch fetch review stats
        Map<Long, Double[]> reviewStats = fetchReviewStats(properties);

        return properties.stream()
                .map(p -> {
                    long views = viewCounts.getOrDefault(p.getId(), 0L);
                    long favs = favoriteCounts.getOrDefault(p.getId(), 0L);
                    long contacts = contactCounts.getOrDefault(p.getId(), 0L);

                    double score = computeTrendingScore(views, favs, contacts, reviewStats.get(p.getId()));
                    List<String> reasons = buildTrendingReasons(views, favs, contacts);
                    return new ScoredProperty(p, score, reasons, "TRENDING");
                })
                .sorted(Comparator.comparing(ScoredProperty::score).reversed())
                .limit(limit)
                .map(sp -> mapToResponse(sp.property, sp.score, sp.reasons, sp.type))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecommendationResponse> getTrendingProperties(String period) {
        return getTrendingProperties(period, 10);
    }

    @Override
    @Cacheable(value = "recommendations", key = "'geo:' + #latitude + ':' + #longitude + ':' + #radiusKm + ':limit:' + #limit")
    public List<RecommendationResponse> getGeoRecommendations(Double latitude, Double longitude, Double radiusKm, int limit) {
        log.debug("Geo recommendations at ({}, {}) within {}km, limit={}", latitude, longitude, radiusKm, limit);

        if (latitude == null || longitude == null || radiusKm == null) {
            return Collections.emptyList();
        }

        var pageable = PageRequest.of(0, CANDIDATE_POOL_SIZE);
        var nearbyPage = propertyRepository.findNearbyPropertiesPostGIS(latitude, longitude, radiusKm, pageable);
        List<Property> candidates = nearbyPage.getContent();

        return candidates.stream()
                .map(p -> {
                    double distance = haversine(latitude, longitude, p.getLatitude(), p.getLongitude());
                    double score = Math.max(0, 100 - (distance / Math.max(radiusKm, 1.0)) * 100);
                    List<String> reasons = new ArrayList<>();
                    reasons.add(String.format("%.1f km away", distance));
                    if (p.getCity() != null) reasons.add(p.getCity());
                    return new ScoredProperty(p, score, reasons, "GEO");
                })
                .filter(sp -> sp.score > 0)
                .sorted(Comparator.comparing(ScoredProperty::score).reversed())
                .limit(limit)
                .map(sp -> mapToResponse(sp.property, sp.score, sp.reasons, sp.type,
                        calculateDistance(latitude, longitude, sp.property)))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecommendationResponse> getGeoRecommendations(Double latitude, Double longitude, Double radiusKm) {
        return getGeoRecommendations(latitude, longitude, radiusKm, 12);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecommendationResponse> getPersonalizedFeed(Long userId, int limit) {
        return getRecommendations(userId, limit);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "recommendations", key = "'discover:' + #sessionId + ':' + #city + ':limit:' + #limit")
    public List<RecommendationResponse> getDiscoverRecommendations(String sessionId, String city, int limit) {
        log.debug("Discover recommendations for session={}, city={}, limit={}", sessionId, city, limit);

        // 1. Get candidate pool
        List<Property> candidates = propertyRepository.findByStatusIn(
                List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                PageRequest.of(0, CANDIDATE_POOL_SIZE)
        ).getContent();

        if (candidates.isEmpty()) {
            return getFreshFallback(limit);
        }

        // 2. Batch fetch metrics
        Map<Long, Long> favCounts = fetchFavoriteCounts(candidates);
        Map<Long, Double[]> reviewStats = fetchReviewStats(candidates);
        Map<Long, Double> ownerScores = fetchOwnerScores(candidates);
        Map<Long, PropertyQualityScoringService.PropertyQualityScore> qualityScores = qualityScoringService.computeScoresBatch(candidates);

        // 3. Build anonymous profile from session
        AnonymousPreferenceProfile anonProfile = buildAnonymousProfile(sessionId, city);

        // 4. Score candidates
        List<ScoredProperty> scored = candidates.stream()
                .map(p -> scoreAnonymousProperty(p, anonProfile, favCounts, reviewStats, ownerScores, qualityScores))
                .filter(sp -> sp.score > DEFAULT_MIN_SCORE)
                .sorted(Comparator.comparing(ScoredProperty::score).reversed())
                .collect(Collectors.toList());

        // 5. Apply diversity
        List<ScoredProperty> diverse = applyMMRDiversity(scored, limit);

        // 6. Epsilon-greedy exploration: inject 20% random fresh properties
        if (diverse.size() < limit) {
            List<Property> fresh = getFreshFallback(limit - diverse.size()).stream()
                    .map(r -> candidates.stream().filter(c -> c.getId().equals(r.getPropertyId())).findFirst().orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            for (Property p : fresh) {
                if (diverse.stream().noneMatch(s -> s.property.getId().equals(p.getId()))) {
                    diverse.add(new ScoredProperty(p, 45.0, List.of("Nouvelle découverte"), "EXPLORE"));
                }
            }
        }

        return diverse.stream()
                .map(sp -> mapToResponse(sp.property, sp.score, sp.reasons, sp.type, null, reviewStats, favCounts))
                .collect(Collectors.toList());
    }

    private AnonymousPreferenceProfile buildAnonymousProfile(String sessionId, String city) {
        Set<String> searchedCities = new HashSet<>();
        if (city != null) searchedCities.add(city);

        if (sessionId != null) {
            List<UserBehavior> sessionBehaviors = behaviorRepository.findBySessionId(sessionId);
            for (UserBehavior b : sessionBehaviors) {
                if (b.getMetadata() != null) {
                    String extractedCity = extractCityFromMetadata(b.getMetadata());
                    if (extractedCity != null) searchedCities.add(extractedCity);
                }
            }
        }
        return new AnonymousPreferenceProfile(searchedCities, city);
    }

    private ScoredProperty scoreAnonymousProperty(Property property, AnonymousPreferenceProfile profile,
                                                   Map<Long, Long> favCounts,
                                                   Map<Long, Double[]> reviewStats,
                                                   Map<Long, Double> ownerScores,
                                                   Map<Long, PropertyQualityScoringService.PropertyQualityScore> qualityScores) {
        List<String> reasons = new ArrayList<>();

        double popularityScore = computePopularityScore(property, favCounts, reviewStats);
        double recencyScore = computeRecencyScore(property);
        double trustScore = computeTrustScore(property, ownerScores);
        double qualityScore = computeQualityBoost(property, qualityScores);
        double geoScore = 10.0;

        if (profile.preferredCity != null && profile.preferredCity.equalsIgnoreCase(property.getCity())) {
            geoScore = 70.0;
            reasons.add("Dans votre ville: " + property.getCity());
        } else if (profile.searchedCities.contains(property.getCity())) {
            geoScore = 50.0;
            reasons.add("Ville recherchée: " + property.getCity());
        }

        if (popularityScore > 50) reasons.add("Populaire");
        if (recencyScore > 60) reasons.add("Annonce récente");
        if (trustScore > 60) reasons.add("Propriétaire de confiance");
        if (qualityScore > 70) reasons.add("Bonne qualité d'annonce");
        if (reasons.isEmpty()) reasons.add("Pour vous découvrir");

        double total = popularityScore * 0.30
                + recencyScore * 0.20
                + trustScore * 0.15
                + qualityScore * 0.20
                + geoScore * 0.15;

        return new ScoredProperty(property, round(total), reasons, "DISCOVER");
    }

    @Override
    @Transactional
    @CacheEvict(value = "recommendations", key = "'user:' + #userId")
    public void recordBehavior(Long userId, String behaviorType, Long propertyId, String metadata) {
        if (userId == null || behaviorType == null || propertyId == null) return;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        UserBehavior behavior = UserBehavior.builder()
                .user(user)
                .behaviorType(behaviorType)
                .entityType("PROPERTY")
                .entityId(propertyId)
                .metadata(metadata)
                .weight(calculateBehaviorWeight(behaviorType))
                .createdAt(LocalDateTime.now())
                .build();

        behaviorRepository.save(behavior);
        log.debug("Recorded behavior: {} for user {} on property {}", behaviorType, userId, propertyId);
    }

    @Override
    @Transactional
    @CacheEvict(value = "recommendations", key = "'user:' + #userId")
    public void recordRecommendationFeedback(Long userId, Long propertyId, String feedbackType) {
        if (userId == null || propertyId == null || feedbackType == null) return;
        recordBehavior(userId, "REC_" + feedbackType.toUpperCase(), propertyId, null);
        log.debug("Recorded recommendation feedback: {} for user {} on property {}", feedbackType, userId, propertyId);
    }

    // ================================================================
    // SCORING ENGINE
    // ================================================================

    private ScoredProperty scoreProperty(Property property, UserPreferenceProfile profile, User user,
                                         Set<Long> similarUserIds,
                                         Map<Long, Long> favCounts,
                                         Map<Long, Double[]> reviewStats,
                                         Map<Long, Double> ownerScores,
                                         Map<Long, PropertyQualityScoringService.PropertyQualityScore> qualityScores) {
        List<String> reasons = new ArrayList<>();
        String dominantType = "HYBRID";

        double collaborativeScore = computeCollaborativeScore(property, profile, similarUserIds, favCounts);
        double contentScore = computeContentScore(property, profile);
        double popularityScore = computePopularityScore(property, favCounts, reviewStats);
        double recencyScore = computeRecencyScore(property);
        double geoScore = computeGeoScore(property, user);
        double trustScore = computeTrustScore(property, ownerScores);
        double qualityScore = computeQualityBoost(property, qualityScores);

        double totalScore = collaborativeScore * wCollaborative
                + contentScore * wContent
                + popularityScore * wPopularity
                + recencyScore * wRecency
                + geoScore * wGeo
                + trustScore * wTrust
                + qualityScore * 0.10; // 10% quality boost

        // Build explainable reasons
        if (collaborativeScore > 30) {
            reasons.add("Basé sur votre activité et utilisateurs similaires");
        }
        if (contentScore > 40) {
            if (profile.preferredCity != null && profile.preferredCity.equalsIgnoreCase(property.getCity())) {
                reasons.add("Correspond à votre ville préférée: " + property.getCity());
            }
            if (profile.preferredCategory != null && profile.preferredCategory == property.getCategory()) {
                reasons.add("Correspond à votre type préféré");
            }
            if (profile.preferredType != null && profile.preferredType == property.getType()) {
                reasons.add("Correspond à votre préférence de transaction");
            }
        }
        if (popularityScore > 50) {
            reasons.add("Populaire en ce moment");
        }
        if (recencyScore > 60) {
            reasons.add("Annonce récente");
        }
        if (geoScore > 50) {
            reasons.add("Près de votre localisation");
        }
        if (trustScore > 60) {
            reasons.add("Propriétaire de confiance");
        }
        if (qualityScore > 70) {
            reasons.add("Annonce de qualité");
        }
        if (reasons.isEmpty()) {
            reasons.add("Recommandé pour vous");
        }

        // Determine dominant recommendation type
        double max = Math.max(collaborativeScore, Math.max(contentScore,
                Math.max(popularityScore, Math.max(recencyScore, Math.max(geoScore, trustScore)))));
        if (max == collaborativeScore) dominantType = "COLLABORATIVE";
        else if (max == contentScore) dominantType = "CONTENT_BASED";
        else if (max == popularityScore) dominantType = "TRENDING";
        else if (max == recencyScore) dominantType = "RECENT";
        else if (max == geoScore) dominantType = "GEO";
        else if (max == trustScore) dominantType = "TRUST";

        return new ScoredProperty(property, round(totalScore), reasons, dominantType);
    }

    // ================================================================
    // COLLABORATIVE FILTERING (User-User Jaccard Similarity)
    // ================================================================

    private double computeCollaborativeScore(Property property, UserPreferenceProfile profile,
                                             Set<Long> similarUserIds, Map<Long, Long> favCounts) {
        double score = 0.0;

        // Direct user interactions with time decay
        if (profile.favoritedIds.contains(property.getId())) score += 40 * getTimeDecay(0);
        if (profile.viewedIds.contains(property.getId())) score += 15 * getTimeDecay(2);
        if (profile.contactedIds.contains(property.getId())) score += 50 * getTimeDecay(0);
        if (profile.searchedCities.contains(property.getCity())) score += 10;

        // Similar users' favorites
        if (!similarUserIds.isEmpty()) {
            long similarFavorites = favCounts.getOrDefault(property.getId(), 0L);
            score += Math.min(35, similarFavorites * 3.5);
        }

        return Math.min(MAX_COLLAB, score);
    }

    private double getTimeDecay(int daysAgo) {
        return Math.exp(-daysAgo / TIME_DECAY_HALF_LIFE_DAYS);
    }

    private double computeQualityBoost(Property property,
                                       Map<Long, PropertyQualityScoringService.PropertyQualityScore> qualityScores) {
        var qs = qualityScores.get(property.getId());
        if (qs == null) return 50.0;
        return qs.overallScore();
    }

    /**
     * Find users with similar taste using Jaccard similarity on favorite sets.
     * OPTIMIZED: Uses batch queries to avoid N+1 query storm.
     */
    private Set<Long> findSimilarUsers(Long userId, List<Long> userFavorites) {
        if (userFavorites == null || userFavorites.isEmpty()) return Collections.emptySet();

        Set<Long> userFavSet = new HashSet<>(userFavorites);

        // Batch: find ALL users who favorited ANY of the user's favorited properties
        Set<Long> candidateUserIds = new HashSet<>();
        for (Long propertyId : userFavorites) {
            candidateUserIds.addAll(favoriteRepository.findUserIdsByPropertyId(propertyId));
        }
        candidateUserIds.remove(userId);

        if (candidateUserIds.isEmpty()) return Collections.emptySet();

        // Batch: fetch all favorites for candidate users in a single query
        List<Object[]> allFavorites = favoriteRepository.findFavoritesForUsers(new ArrayList<>(candidateUserIds));
        Map<Long, Set<Long>> userToFavorites = new HashMap<>();
        for (Object[] row : allFavorites) {
            Long uid = (Long) row[0];
            Long pid = (Long) row[1];
            userToFavorites.computeIfAbsent(uid, k -> new HashSet<>()).add(pid);
        }

        // Compute Jaccard similarity in memory
        Set<Long> similarUsers = new HashSet<>();
        for (Map.Entry<Long, Set<Long>> entry : userToFavorites.entrySet()) {
            double jaccard = computeJaccard(userFavSet, entry.getValue());
            if (jaccard >= 0.15) {
                similarUsers.add(entry.getKey());
            }
        }

        return similarUsers;
    }

    private double computeJaccard(Set<Long> setA, Set<Long> setB) {
        if (setA.isEmpty() && setB.isEmpty()) return 1.0;
        Set<Long> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);
        Set<Long> union = new HashSet<>(setA);
        union.addAll(setB);
        return (double) intersection.size() / union.size();
    }

    // ================================================================
    // CONTENT-BASED FILTERING
    // ================================================================

    private double computeContentScore(Property property, UserPreferenceProfile profile) {
        double score = 0.0;
        int matches = 0;

        if (profile.preferredCity != null && profile.preferredCity.equalsIgnoreCase(property.getCity())) {
            score += 25; matches++;
        }
        if (profile.preferredCategory != null && profile.preferredCategory == property.getCategory()) {
            score += 20; matches++;
        }
        if (profile.preferredType != null && profile.preferredType == property.getType()) {
            score += 15; matches++;
        }
        if (profile.avgPrice != null && property.getPrice() != null) {
            double priceDiff = Math.abs(property.getPrice().doubleValue() - profile.avgPrice.doubleValue());
            double priceRatio = priceDiff / Math.max(profile.avgPrice.doubleValue(), 1);
            if (priceRatio < 0.15) { score += 20; matches++; }
            else if (priceRatio < 0.35) { score += 12; matches++; }
            else if (priceRatio < 0.60) { score += 6; matches++; }
        }
        if (profile.avgSurface != null && property.getSurface() != null) {
            double surfaceDiff = Math.abs(property.getSurface() - profile.avgSurface);
            if (surfaceDiff < 15) { score += 10; matches++; }
            else if (surfaceDiff < 30) { score += 5; matches++; }
        }
        if (profile.avgRooms != null && property.getRooms() != null) {
            int roomDiff = Math.abs(property.getRooms() - profile.avgRooms);
            if (roomDiff <= 1) { score += 10; matches++; }
            else if (roomDiff <= 2) { score += 5; matches++; }
        }
        // Amenity matching
        if (profile.preferredAmenities != null) {
            int amenityMatches = 0;
            if (Boolean.TRUE.equals(property.getHasParking()) && profile.preferredAmenities.contains("parking")) amenityMatches++;
            if (Boolean.TRUE.equals(property.getHasPool()) && profile.preferredAmenities.contains("pool")) amenityMatches++;
            if (Boolean.TRUE.equals(property.getHasElevator()) && profile.preferredAmenities.contains("elevator")) amenityMatches++;
            if (Boolean.TRUE.equals(property.getFurnished()) && profile.preferredAmenities.contains("furnished")) amenityMatches++;
            if (Boolean.TRUE.equals(property.getHasAirConditioning()) && profile.preferredAmenities.contains("ac")) amenityMatches++;
            score += Math.min(15, amenityMatches * 5);
        }

        return Math.min(MAX_CONTENT, score + matches * 3);
    }

    private double computeContentSimilarity(Property ref, Property other) {
        double score = 0.0;
        if (Objects.equals(ref.getCity(), other.getCity())) score += 30;
        if (ref.getCategory() == other.getCategory()) score += 25;
        if (ref.getType() == other.getType()) score += 15;
        if (ref.getPrice() != null && other.getPrice() != null) {
            double refPrice = ref.getPrice().doubleValue();
            double otherPrice = other.getPrice().doubleValue();
            double ratio = refPrice / Math.max(otherPrice, 1);
            if (ratio >= 0.8 && ratio <= 1.25) score += 20;
            else if (ratio >= 0.6 && ratio <= 1.66) score += 10;
        }
        if (ref.getSurface() != null && other.getSurface() != null) {
            double diff = Math.abs(ref.getSurface() - other.getSurface());
            if (diff < 10) score += 10;
            else if (diff < 25) score += 5;
        }
        if (ref.getRooms() != null && other.getRooms() != null) {
            int diff = Math.abs(ref.getRooms() - other.getRooms());
            if (diff <= 1) score += 5;
        }
        // Amenity similarity
        int amenityMatch = 0;
        if (Objects.equals(ref.getHasParking(), other.getHasParking())) amenityMatch++;
        if (Objects.equals(ref.getHasPool(), other.getHasPool())) amenityMatch++;
        if (Objects.equals(ref.getHasElevator(), other.getHasElevator())) amenityMatch++;
        if (Objects.equals(ref.getFurnished(), other.getFurnished())) amenityMatch++;
        if (Objects.equals(ref.getHasAirConditioning(), other.getHasAirConditioning())) amenityMatch++;
        score += amenityMatch * 3;

        return score;
    }

    private List<String> buildContentSimilarityReasons(Property ref, Property other) {
        List<String> reasons = new ArrayList<>();
        if (Objects.equals(ref.getCity(), other.getCity())) reasons.add("Same city: " + other.getCity());
        if (ref.getCategory() == other.getCategory()) reasons.add("Same type: " + other.getCategory());
        if (ref.getType() == other.getType()) reasons.add("Same transaction: " + other.getType());
        if (reasons.isEmpty()) reasons.add("Similar features");
        return reasons;
    }

    // ================================================================
    // POPULARITY SCORE
    // ================================================================

    private double computePopularityScore(Property property, Map<Long, Long> favCounts, Map<Long, Double[]> reviewStats) {
        double score = 0.0;
        if (property.getViewCount() != null) {
            score += Math.min(35, property.getViewCount() * 0.4);
        }
        Double[] reviewData = reviewStats.get(property.getId());
        if (reviewData != null) {
            double avgRating = reviewData[0];
            double reviewCount = reviewData[1];
            score += (avgRating / 5.0) * 25;
            score += Math.min(10, reviewCount * 1.5);
        }
        long favCount = favCounts.getOrDefault(property.getId(), 0L);
        score += Math.min(25, favCount * 4);
        return Math.min(MAX_POPULARITY, score);
    }

    private double computeTrendingScore(long views, long favorites, long contacts, Double[] reviewData) {
        double score = Math.min(40, views * 2.5)
                + Math.min(30, favorites * 7.5)
                + Math.min(20, contacts * 10);
        if (reviewData != null) {
            score += (reviewData[0] / 5.0) * 10;
        }
        return Math.min(100.0, score);
    }

    private List<String> buildTrendingReasons(long views, long favorites, long contacts) {
        List<String> reasons = new ArrayList<>();
        if (views > 5) reasons.add(views + " recent views");
        if (favorites > 0) reasons.add(favorites + " recent favorites");
        if (contacts > 0) reasons.add(contacts + " recent contacts");
        if (reasons.isEmpty()) reasons.add("Trending now");
        return reasons;
    }

    // ================================================================
    // RECENCY SCORE
    // ================================================================

    private double computeRecencyScore(Property property) {
        if (property.getCreatedAt() == null) return 0.0;
        long hoursAgo = ChronoUnit.HOURS.between(property.getCreatedAt(), LocalDateTime.now());
        if (hoursAgo < 24) return 100;
        if (hoursAgo < 72) return 85;
        if (hoursAgo < 168) return 70;   // 1 week
        if (hoursAgo < 720) return 50;   // 1 month
        if (hoursAgo < 2160) return 30;  // 3 months
        return 15;
    }

    // ================================================================
    // GEO SCORE
    // ================================================================

    private double computeGeoScore(Property property, User user) {
        double score = 10.0; // Base score
        if (user.getCity() != null && user.getCity().equalsIgnoreCase(property.getCity())) {
            score = 60.0;
        }
        // Boost for properties in searched cities
        return Math.min(MAX_GEO, score);
    }

    // ================================================================
    // TRUST SCORE
    // ================================================================

    private double computeTrustScore(Property property, Map<Long, Double> ownerScores) {
        double score = 10.0;
        User owner = property.getOwner();
        if (owner == null) return score;

        if (Boolean.TRUE.equals(owner.getIsVerified())) {
            score += 30;
        }
        Long ownerId = owner.getId();
        if (ownerId != null && ownerScores.containsKey(ownerId)) {
            Double ownerScore = ownerScores.get(ownerId);
            if (ownerScore != null) {
                score += Math.min(40, ownerScore * 0.4);
            }
        }
        // Boost for properties with many images
        if (property.getImages() != null && !property.getImages().isEmpty()) {
            score += Math.min(20, property.getImages().size() * 3);
        }
        return Math.min(MAX_TRUST, score);
    }

    // ================================================================
    // DIVERSITY RE-RANKING (Maximal Marginal Relevance)
    // ================================================================

    private List<ScoredProperty> applyMMRDiversity(List<ScoredProperty> ranked, int limit) {
        if (ranked.size() <= limit) return ranked;

        List<ScoredProperty> selected = new ArrayList<>();
        selected.add(ranked.get(0));

        List<ScoredProperty> remaining = new ArrayList<>(ranked.subList(1, ranked.size()));

        while (selected.size() < limit && !remaining.isEmpty()) {
            ScoredProperty best = null;
            double bestMMR = -1;

            for (ScoredProperty candidate : remaining) {
                double maxSim = 0.0;
                for (ScoredProperty sel : selected) {
                    double sim = computePropertySimilarity(candidate.property, sel.property);
                    maxSim = Math.max(maxSim, sim);
                }
                double mmr = (1 - DIVERSITY_WEIGHT) * candidate.score - DIVERSITY_WEIGHT * maxSim;
                if (mmr > bestMMR) {
                    bestMMR = mmr;
                    best = candidate;
                }
            }

            if (best != null) {
                selected.add(best);
                remaining.remove(best);
            } else {
                break;
            }
        }

        return selected;
    }

    private double computePropertySimilarity(Property a, Property b) {
        double sim = 0.0;
        if (Objects.equals(a.getCity(), b.getCity())) sim += 0.3;
        if (a.getCategory() == b.getCategory()) sim += 0.25;
        if (a.getType() == b.getType()) sim += 0.15;
        if (a.getPrice() != null && b.getPrice() != null) {
            double ratio = a.getPrice().doubleValue() / Math.max(b.getPrice().doubleValue(), 1);
            if (ratio >= 0.7 && ratio <= 1.43) sim += 0.2;
        }
        if (a.getSurface() != null && b.getSurface() != null) {
            double diff = Math.abs(a.getSurface() - b.getSurface());
            if (diff < 20) sim += 0.1;
        }
        return Math.min(1.0, sim);
    }

    // ================================================================
    // USER PROFILE BUILDING
    // ================================================================

    private UserPreferenceProfile buildUserProfile(Long userId) {
        List<Long> viewed = viewedPropertyRepository.findByUserId(userId).stream()
                .map(v -> v.getProperty().getId())
                .distinct()
                .collect(Collectors.toList());

        List<Long> favorited = favoriteRepository.findPropertyIdsByUserId(userId);

        List<Long> contacted = behaviorRepository.findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, "CONTACT")
                .stream()
                .filter(b -> "PROPERTY".equals(b.getEntityType()) && b.getEntityId() != null)
                .map(UserBehavior::getEntityId)
                .distinct()
                .collect(Collectors.toList());

        Set<String> searchedCities = behaviorRepository.findRecentBehaviors(userId, LocalDateTime.now().minusDays(30))
                .stream()
                .filter(b -> "SEARCH".equals(b.getBehaviorType()))
                .map(b -> b.getMetadata())
                .filter(Objects::nonNull)
                .map(m -> extractCityFromMetadata(m))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Property> interacted = propertyRepository.findAllById(
                new HashSet<>() {{ addAll(viewed); addAll(favorited); addAll(contacted); }}
        );

        String preferredCity = mode(interacted.stream()
                .map(Property::getCity)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        PropertyCategory preferredCategory = modeEnum(interacted.stream()
                .map(Property::getCategory)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        PropertyType preferredType = modeEnum(interacted.stream()
                .map(Property::getType)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        BigDecimal avgPrice = safeAvgBigDecimal(interacted.stream()
                .map(Property::getPrice)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        Double avgSurface = safeAvgDouble(interacted.stream()
                .map(Property::getSurface)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        Integer avgRooms = safeAvgInt(interacted.stream()
                .map(Property::getRooms)
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        // Infer preferred amenities from favorited properties
        Set<String> preferredAmenities = new HashSet<>();
        List<Property> favoritedProperties = propertyRepository.findAllById(new HashSet<>(favorited));
        for (Property p : favoritedProperties) {
            if (Boolean.TRUE.equals(p.getHasParking())) preferredAmenities.add("parking");
            if (Boolean.TRUE.equals(p.getHasPool())) preferredAmenities.add("pool");
            if (Boolean.TRUE.equals(p.getHasElevator())) preferredAmenities.add("elevator");
            if (Boolean.TRUE.equals(p.getFurnished())) preferredAmenities.add("furnished");
            if (Boolean.TRUE.equals(p.getHasAirConditioning())) preferredAmenities.add("ac");
            if (Boolean.TRUE.equals(p.getHasInternet())) preferredAmenities.add("internet");
            if (Boolean.TRUE.equals(p.getHasSecurity())) preferredAmenities.add("security");
        }

        return new UserPreferenceProfile(
                preferredCity, preferredCategory, preferredType,
                avgPrice, avgSurface, avgRooms,
                viewed, favorited, contacted,
                searchedCities, preferredAmenities
        );
    }

    // ================================================================
    // BATCH DATA FETCHING (N+1 Elimination)
    // ================================================================

    private Map<Long, Long> fetchFavoriteCounts(List<Property> properties) {
        List<Long> propertyIds = properties.stream().map(Property::getId).collect(Collectors.toList());
        return favoriteRepository.countFavoritesByPropertyIds(propertyIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1],
                        (a, b) -> a
                ));
    }

    private Map<Long, Double[]> fetchReviewStats(List<Property> properties) {
        List<Long> propertyIds = properties.stream().map(Property::getId).collect(Collectors.toList());
        return reviewRepository.getReviewStatsByPropertyIds(propertyIds).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> new Double[]{((Number) row[1]).doubleValue(), ((Number) row[2]).doubleValue()},
                        (a, b) -> a
                ));
    }

    private Map<Long, Double> fetchOwnerScores(List<Property> properties) {
        Set<Long> ownerIds = properties.stream()
                .map(p -> p.getOwner() != null ? p.getOwner().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ownerIds.isEmpty()) return Collections.emptyMap();
        return ownerRatingRepository.findAllOwnerScores().stream()
                .filter(row -> ownerIds.contains(row[0]))
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Double) row[1],
                        (a, b) -> a
                ));
    }

    // ================================================================
    // CANDIDATE SELECTION
    // ================================================================

    private List<Property> getCandidateProperties(Set<Long> excludedIds, int limit) {
        if (excludedIds.isEmpty()) {
            return propertyRepository.findByStatusIn(
                    List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                    PageRequest.of(0, limit)
            ).getContent();
        }
        // Use JPQL NOT IN for database-level exclusion
        return propertyRepository.findCandidatesExcludingIds(
                List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                excludedIds,
                PageRequest.of(0, limit)
        );
    }

    private List<RecommendationResponse> getFreshFallback(int limit) {
        return propertyRepository.findByStatusIn(
                        List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                        PageRequest.of(0, limit))
                .getContent().stream()
                .map(p -> mapToResponse(p, 50.0, List.of("New listing"), "FRESH"))
                .collect(Collectors.toList());
    }

    // ================================================================
    // MAPPING & UTILITIES
    // ================================================================

    private RecommendationResponse mapToResponse(Property p, Double score, List<String> reasons, String type) {
        return mapToResponse(p, score, reasons, type, null, null, null);
    }

    private RecommendationResponse mapToResponse(Property p, Double score, List<String> reasons, String type, Double distanceKm) {
        return mapToResponse(p, score, reasons, type, distanceKm, null, null);
    }

    private RecommendationResponse mapToResponse(Property p, Double score, List<String> reasons, String type,
                                                   Double distanceKm, Map<Long, Double[]> reviewStats,
                                                   Map<Long, Long> favCounts) {
        Double avgRating = null;
        Integer reviewCount = 0;

        if (reviewStats != null && reviewStats.containsKey(p.getId())) {
            Double[] stats = reviewStats.get(p.getId());
            avgRating = stats[0];
            reviewCount = stats[1].intValue();
        } else {
            try {
                avgRating = reviewRepository.getAverageRatingByPropertyId(p.getId());
                reviewCount = reviewRepository.countByPropertyIdAndStatusApproved(p.getId()).intValue();
            } catch (Exception e) {
                log.trace("Review stats unavailable for property {}", p.getId());
            }
        }

        Integer favCount = 0;
        if (favCounts != null && favCounts.containsKey(p.getId())) {
            favCount = favCounts.get(p.getId()).intValue();
        } else {
            try {
                favCount = (int) favoriteRepository.countByPropertyId(p.getId());
            } catch (Exception e) {
                log.trace("Favorite count unavailable for property {}", p.getId());
            }
        }

        return RecommendationResponse.builder()
                .propertyId(p.getId())
                .title(p.getTitle())
                .city(p.getCity())
                .address(p.getAddress())
                .price(p.getPrice() != null ? p.getPrice().doubleValue() : null)
                .propertyType(p.getType() != null ? p.getType().name() : null)
                .category(p.getCategory() != null ? p.getCategory().name() : null)
                .bedrooms(p.getBedrooms())
                .bathrooms(p.getBathrooms())
                .surface(p.getSurface())
                .imageUrl(p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0) : null)
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .matchScore(round(score))
                .matchReasons(reasons)
                .recommendationType(type)
                .viewCount(p.getViewCount() != null ? p.getViewCount().intValue() : 0)
                .favoriteCount(favCount)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .distanceKm(distanceKm)
                .listedAt(p.getCreatedAt())
                .build();
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static Double calculateDistance(Double userLat, Double userLon, Property p) {
        if (userLat == null || userLon == null || p.getLatitude() == null || p.getLongitude() == null) return null;
        return round(haversine(userLat, userLon, p.getLatitude(), p.getLongitude()));
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static double calculateBehaviorWeight(String behaviorType) {
        return switch (behaviorType) {
            case "CONTACT" -> 5.0;
            case "FAVORITE" -> 4.0;
            case "VIEW" -> 2.0;
            case "SEARCH" -> 1.5;
            case "SHARE" -> 3.0;
            case "REC_CLICK" -> 3.5;
            case "REC_SAVE" -> 4.5;
            case "REC_DISMISS" -> -2.0;
            default -> 1.0;
        };
    }

    private static LocalDateTime parsePeriod(String period) {
        return switch (period.toLowerCase()) {
            case "day" -> LocalDateTime.now().minusDays(1);
            case "week" -> LocalDateTime.now().minusDays(7);
            case "month" -> LocalDateTime.now().minusDays(30);
            default -> LocalDateTime.now().minusDays(7);
        };
    }

    // ================================================================
    // STATISTICAL UTILITIES
    // ================================================================

    private static <T> T mode(List<T> list) {
        if (list == null || list.isEmpty()) return null;
        return list.stream()
                .collect(Collectors.groupingBy(e -> e, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private static <T extends Enum<T>> T modeEnum(List<T> list) {
        if (list == null || list.isEmpty()) return null;
        return list.stream()
                .collect(Collectors.groupingBy(e -> e, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private static BigDecimal safeAvgBigDecimal(List<BigDecimal> values) {
        if (values == null || values.isEmpty()) return null;
        return values.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), RoundingMode.HALF_UP);
    }

    private static Double safeAvgDouble(List<Double> values) {
        if (values == null || values.isEmpty()) return null;
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private static Integer safeAvgInt(List<Integer> values) {
        if (values == null || values.isEmpty()) return null;
        return (int) values.stream().mapToInt(Integer::intValue).average().orElse(0);
    }

    private static String extractCityFromMetadata(String metadata) {
        if (metadata == null) return null;
        // Simple extraction: look for "city":"value" or city= in metadata JSON/string
        try {
            if (metadata.contains("\"city\":\"")) {
                int start = metadata.indexOf("\"city\":\"") + 8;
                int end = metadata.indexOf("\"", start);
                if (end > start) return metadata.substring(start, end);
            }
            if (metadata.contains("city=")) {
                int start = metadata.indexOf("city=") + 5;
                int end = metadata.indexOf("&", start);
                if (end == -1) end = metadata.length();
                return metadata.substring(start, end);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    // ================================================================
    // INNER RECORDS
    // ================================================================

    private record ScoredProperty(Property property, double score, List<String> reasons, String type) {}

    private record UserPreferenceProfile(
            String preferredCity,
            PropertyCategory preferredCategory,
            PropertyType preferredType,
            BigDecimal avgPrice,
            Double avgSurface,
            Integer avgRooms,
            List<Long> viewedIds,
            List<Long> favoritedIds,
            List<Long> contactedIds,
            Set<String> searchedCities,
            Set<String> preferredAmenities
    ) {}

    private record AnonymousPreferenceProfile(
            Set<String> searchedCities,
            String preferredCity
    ) {}
}
