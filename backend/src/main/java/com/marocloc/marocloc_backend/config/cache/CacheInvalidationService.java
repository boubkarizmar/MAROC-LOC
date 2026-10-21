package com.marocloc.marocloc_backend.config.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheInvalidationService {

    private final StringRedisTemplate redisTemplate;

    public void invalidateProperty(Long propertyId) {
        String pattern = "marocloc:properties::*" + propertyId + "*";
        invalidatePattern(pattern);
        log.info("Invalidated cache for property {}", propertyId);
    }

    public void invalidateSearch(String city, String type) {
        String pattern = String.format("marocloc:searchResults::*%s*%s*", city, type);
        invalidatePattern(pattern);
    }

    public void invalidateUserRecommendations(Long userId) {
        String pattern = "marocloc:recommendations::*" + userId + "*";
        invalidatePattern(pattern);
    }

    public void invalidateUserProfile(Long userId) {
        String pattern = "marocloc:userProfile::*" + userId + "*";
        invalidatePattern(pattern);
    }

    public void invalidateAnalytics() {
        String pattern = "marocloc:analytics::*";
        invalidatePattern(pattern);
    }

    public void invalidateAll() {
        Set<String> keys = redisTemplate.keys("marocloc::*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("Invalidated {} cache keys", keys.size());
        }
    }

    private void invalidatePattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
