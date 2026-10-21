package com.marocloc.marocloc_backend.subscription.service;

import com.marocloc.marocloc_backend.subscription.dto.FeatureUsageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionEnforcementService {

    private final StringRedisTemplate redisTemplate;

    private static final Map<String, Map<String, Integer>> TIER_LIMITS = Map.of(
            "FREE", Map.of(
                    "listings_active", 1,
                    "ai_chat_messages", 5,
                    "photos_per_listing", 5,
                    "boosts_per_month", 0,
                    "analytics_access", 0
            ),
            "PREMIUM", Map.of(
                    "listings_active", 10,
                    "ai_chat_messages", Integer.MAX_VALUE,
                    "photos_per_listing", 15,
                    "boosts_per_month", 2,
                    "analytics_access", 1
            ),
            "FEATURED", Map.of(
                    "listings_active", Integer.MAX_VALUE,
                    "ai_chat_messages", Integer.MAX_VALUE,
                    "photos_per_listing", 50,
                    "boosts_per_month", 10,
                    "analytics_access", 1
            )
    );

    private static final Map<String, String> FEATURE_NAMES = Map.of(
            "listings_active", "Annonces actives",
            "ai_chat_messages", "Messages IA",
            "photos_per_listing", "Photos par annonce",
            "boosts_per_month", "Boosts mensuels",
            "analytics_access", "Accès analytiques"
    );

    public boolean canUseFeature(Long userId, String tier, String featureKey) {
        Map<String, Integer> limits = TIER_LIMITS.getOrDefault(tier, TIER_LIMITS.get("FREE"));
        int limit = limits.getOrDefault(featureKey, 0);

        if (limit == Integer.MAX_VALUE) return true;
        if (limit == 0) return false;

        String periodKey = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String redisKey = String.format("usage:%d:%s:%s", userId, featureKey, periodKey);

        String current = redisTemplate.opsForValue().get(redisKey);
        int used = current != null ? Integer.parseInt(current) : 0;

        return used < limit;
    }

    public void incrementUsage(Long userId, String featureKey) {
        String periodKey = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String redisKey = String.format("usage:%d:%s:%s", userId, featureKey, periodKey);

        Long newVal = redisTemplate.opsForValue().increment(redisKey);
        if (newVal != null && newVal == 1) {
            long secondsUntilMonthEnd = ChronoUnit.SECONDS.between(
                    LocalDate.now().atStartOfDay(),
                    LocalDate.now().plusMonths(1).withDayOfMonth(1).atStartOfDay()
            );
            redisTemplate.expire(redisKey, secondsUntilMonthEnd, TimeUnit.SECONDS);
        }
    }

    public List<FeatureUsageResponse> getUsageForUser(Long userId, String tier) {
        String periodKey = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        Map<String, Integer> limits = TIER_LIMITS.getOrDefault(tier, TIER_LIMITS.get("FREE"));

        return limits.entrySet().stream().map(entry -> {
            String key = entry.getKey();
            int limit = entry.getValue();
            String redisKey = String.format("usage:%d:%s:%s", userId, key, periodKey);
            String current = redisTemplate.opsForValue().get(redisKey);
            int used = current != null ? Integer.parseInt(current) : 0;

            boolean unlimited = limit == Integer.MAX_VALUE;
            int remaining = unlimited ? Integer.MAX_VALUE : Math.max(0, limit - used);
            double percentage = unlimited ? 0.0 : (limit > 0 ? (used * 100.0 / limit) : 0.0);

            return FeatureUsageResponse.builder()
                    .featureKey(key)
                    .featureName(FEATURE_NAMES.getOrDefault(key, key))
                    .usageCount(used)
                    .usageLimit(unlimited ? null : limit)
                    .remaining(unlimited ? null : remaining)
                    .unlimited(unlimited)
                    .percentageUsed(Math.min(100.0, percentage))
                    .build();
        }).toList();
    }

    public int getListingLimit(String tier) {
        return TIER_LIMITS.getOrDefault(tier, TIER_LIMITS.get("FREE")).getOrDefault("listings_active", 1);
    }

    public boolean hasAnalyticsAccess(String tier) {
        return TIER_LIMITS.getOrDefault(tier, TIER_LIMITS.get("FREE"))
                .getOrDefault("analytics_access", 0) > 0;
    }
}
