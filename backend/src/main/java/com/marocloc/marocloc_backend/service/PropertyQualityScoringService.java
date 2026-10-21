package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyCategory;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynamic Property Quality Scoring Engine.
 *
 * Computes multi-dimensional quality and competitiveness scores for properties.
 * Scores are NOT static — they evolve based on market conditions, engagement,
 * listing quality, and temporal factors.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyQualityScoringService {

    private final PropertyRepository propertyRepository;

    private volatile Map<String, MarketAverage> marketAveragesCache = null;
    private volatile LocalDateTime marketCacheTime = null;
    private static final long MARKET_CACHE_MINUTES = 5;

    @Cacheable(value = "propertyQualityScores", key = "'qscore:' + #property.id")
    public PropertyQualityScore computeScore(Property property) {
        if (property == null) return PropertyQualityScore.empty();

        double completeness = computeListingCompleteness(property);
        double mediaQuality = computeMediaQuality(property);
        double descriptionQuality = computeDescriptionQuality(property);
        double priceCompetitiveness = computePriceCompetitiveness(property);
        double engagementVelocity = computeEngagementVelocity(property);
        double trustScore = computeTrustScore(property);
        double freshness = computeFreshness(property);
        double locationPremium = computeLocationPremium(property);

        double total = completeness * 0.15
                + mediaQuality * 0.15
                + descriptionQuality * 0.10
                + priceCompetitiveness * 0.20
                + engagementVelocity * 0.15
                + trustScore * 0.10
                + freshness * 0.10
                + locationPremium * 0.05;

        return new PropertyQualityScore(
                property.getId(), round(total), round(completeness), round(mediaQuality),
                round(descriptionQuality), round(priceCompetitiveness), round(engagementVelocity),
                round(trustScore), round(freshness), round(locationPremium), LocalDateTime.now()
        );
    }

    public Map<Long, PropertyQualityScore> computeScoresBatch(List<Property> properties) {
        getMarketAverages(); // warm cache
        // Use stream() instead of parallelStream() to avoid LazyInitializationException
        // when accessing property.owner inside parallel worker threads
        return properties.stream()
                .collect(Collectors.toMap(Property::getId, this::computeScore, (a, b) -> a));
    }

    private double computeListingCompleteness(Property p) {
        int total = 18, filled = 0;
        if (hasText(p.getTitle())) filled++;
        if (hasText(p.getDescription())) filled++;
        if (p.getPrice() != null && p.getPrice().doubleValue() > 0) filled++;
        if (hasText(p.getCity())) filled++;
        if (hasText(p.getAddress())) filled++;
        if (p.getSurface() != null && p.getSurface() > 0) filled++;
        if (p.getRooms() != null && p.getRooms() > 0) filled++;
        if (p.getBedrooms() != null) filled++;
        if (p.getBathrooms() != null) filled++;
        if (p.getCategory() != null) filled++;
        if (p.getType() != null) filled++;
        if (p.getCondition() != null) filled++;
        if (p.getLatitude() != null && p.getLongitude() != null) filled++;
        if (hasText(p.getPhoneNumber()) || hasText(p.getWhatsappNumber())) filled++;
        if (p.getBuildingAge() != null || p.getConstructionYear() != null) filled++;
        if (p.getFloorNumber() != null) filled++;
        if (p.getPaymentMethod() != null) filled++;
        if (p.getOwner() != null && hasText(p.getOwner().getName())) filled++;
        return (double) filled / total * 100.0;
    }

    private double computeMediaQuality(Property p) {
        double score = 0;
        List<String> images = p.getImages();
        if (images != null) {
            long valid = images.stream().filter(img -> img != null && !img.isBlank()).count();
            score += Math.min(60, valid * 10);
        }
        if (hasText(p.getVideoTour())) score += 25;
        if (score > 0) score += 15;
        return Math.min(100, score);
    }

    private double computeDescriptionQuality(Property p) {
        String desc = p.getDescription();
        if (!hasText(desc)) return 0;
        int len = desc.length();
        double score = 0;
        if (len >= 500) score += 40;
        else if (len >= 200) score += 25;
        else if (len >= 50) score += 10;

        String lower = desc.toLowerCase();
        String[] keywords = {"m²","metre","chambre","salon","cuisine","salle de bain",
                "balcon","terrasse","jardin","piscine","garage","parking","calme",
                "sécurisé","lumineux","résidence","immeuble","proche","tram","bus",
                "école","mosquée","marché","vue","orient","sud","nord","neuf","rénové"};
        int kw = 0;
        for (String k : keywords) if (lower.contains(k)) kw++;
        score += Math.min(40, kw * 4);
        if (desc.matches(".*\\d+.*")) score += 10;
        if (desc.split("[.!?]").length > 2) score += 10;
        return Math.min(100, score);
    }

    private double computePriceCompetitiveness(Property p) {
        if (p.getPrice() == null || p.getSurface() == null || p.getSurface() <= 0) return 50.0;
        double pps = p.getPrice().doubleValue() / p.getSurface();
        String key = buildMarketKey(p.getCity(), p.getCategory(), p.getType());
        MarketAverage avg = getMarketAverages().get(key);
        if (avg == null || avg.avgPricePerSqm() <= 0) return 50.0;
        double ratio = pps / avg.avgPricePerSqm();
        if (ratio <= 0.7) return 95;
        if (ratio <= 0.85) return 85;
        if (ratio <= 1.0) return 75;
        if (ratio <= 1.15) return 60;
        if (ratio <= 1.3) return 45;
        if (ratio <= 1.5) return 30;
        return 15;
    }

    private double computeEngagementVelocity(Property p) {
        if (p.getCreatedAt() == null) return 50;
        long days = Math.max(1, ChronoUnit.DAYS.between(p.getCreatedAt(), LocalDateTime.now()));
        long views = p.getViewCount() != null ? p.getViewCount() : 0;
        double vpd = (double) views / days;
        if (vpd >= 10) return 100;
        if (vpd >= 5) return 85;
        if (vpd >= 2) return 70;
        if (vpd >= 1) return 55;
        if (vpd >= 0.5) return 40;
        if (vpd >= 0.2) return 25;
        return 10;
    }

    private double computeTrustScore(Property p) {
        double score = 30;
        if (p.getOwner() != null) {
            if (Boolean.TRUE.equals(p.getOwner().getIsVerified())) score += 25;
            if (hasText(p.getOwner().getPhoneNumber())) score += 10;
            if (hasText(p.getOwner().getCin())) score += 10;
        }
        if (Boolean.TRUE.equals(p.getIsVerified())) score += 15;
        List<String> images = p.getImages();
        if (images != null && images.size() >= 3) score += 10;
        return Math.min(100, score);
    }

    private double computeFreshness(Property p) {
        LocalDateTime ref = p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt();
        if (ref == null) return 50;
        long hours = ChronoUnit.HOURS.between(ref, LocalDateTime.now());
        if (hours < 6) return 100;
        if (hours < 24) return 95;
        if (hours < 72) return 85;
        if (hours < 168) return 70;
        if (hours < 336) return 55;
        if (hours < 720) return 40;
        if (hours < 2160) return 25;
        return 10;
    }

    private double computeLocationPremium(Property p) {
        double s = 0;
        if (Boolean.TRUE.equals(p.getCityCenter())) s += 20;
        if (Boolean.TRUE.equals(p.getNearTram())) s += 15;
        if (Boolean.TRUE.equals(p.getNearBus())) s += 10;
        if (Boolean.TRUE.equals(p.getNearSchool())) s += 10;
        if (Boolean.TRUE.equals(p.getNearUniversity())) s += 10;
        if (Boolean.TRUE.equals(p.getNearHospital())) s += 10;
        if (Boolean.TRUE.equals(p.getNearMarket())) s += 10;
        if (Boolean.TRUE.equals(p.getPopularArea())) s += 15;
        if (Boolean.TRUE.equals(p.getSeaView())) s += 20;
        if (Boolean.TRUE.equals(p.getGardenView())) s += 10;
        return Math.min(100, s + 10);
    }

    private synchronized Map<String, MarketAverage> getMarketAverages() {
        if (marketAveragesCache != null && marketCacheTime != null
                && ChronoUnit.MINUTES.between(marketCacheTime, LocalDateTime.now()) < MARKET_CACHE_MINUTES) {
            return marketAveragesCache;
        }
        var props = propertyRepository.findByStatusIn(
                List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE),
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        Map<String, List<Property>> grouped = props.stream()
                .filter(p -> p.getCity() != null && p.getCategory() != null && p.getType() != null)
                .filter(p -> p.getPrice() != null && p.getSurface() != null && p.getSurface() > 0)
                .collect(Collectors.groupingBy(p -> buildMarketKey(p.getCity(), p.getCategory(), p.getType())));

        marketAveragesCache = new HashMap<>();
        for (var e : grouped.entrySet()) {
            var pps = e.getValue().stream()
                    .map(p -> p.getPrice().doubleValue() / p.getSurface())
                    .sorted().collect(Collectors.toList());
            if (pps.isEmpty()) continue;
            double avg = pps.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            double med = pps.get(pps.size() / 2);
            marketAveragesCache.put(e.getKey(), new MarketAverage(avg, med, pps.size()));
        }
        marketCacheTime = LocalDateTime.now();
        return marketAveragesCache;
    }

    private String buildMarketKey(String city, PropertyCategory cat, com.marocloc.marocloc_backend.model.PropertyType type) {
        return (city + "|" + cat + "|" + type).toUpperCase();
    }

    private static boolean hasText(String s) { return s != null && !s.isBlank(); }
    private static double round(double v) { return Math.round(v * 10.0) / 10.0; }

    public record PropertyQualityScore(
            Long propertyId, double overallScore, double listingCompleteness,
            double mediaQuality, double descriptionQuality, double priceCompetitiveness,
            double engagementVelocity, double trustScore, double freshness,
            double locationPremium, LocalDateTime computedAt
    ) {
        public static PropertyQualityScore empty() {
            return new PropertyQualityScore(null, 0, 0, 0, 0, 0, 0, 0, 0, 0, LocalDateTime.now());
        }
    }

    private record MarketAverage(double avgPricePerSqm, double medianPricePerSqm, int sampleSize) {}
}
