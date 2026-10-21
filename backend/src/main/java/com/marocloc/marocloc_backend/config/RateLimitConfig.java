package com.marocloc.marocloc_backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting configuration using Bucket4j
 * Protects against brute force attacks and abuse
 */
@Configuration
@RequiredArgsConstructor
public class RateLimitConfig {

    /**
     * Rate limit for authentication endpoints (login/register/refresh)
     * 5 requests per minute per IP
     */
    @Bean
    public ConcurrentHashMap<String, Bucket> authRateLimitCache() {
        return new ConcurrentHashMap<>();
    }

    /**
     * Rate limit for general API endpoints
     * 100 requests per minute per IP
     */
    @Bean
    public ConcurrentHashMap<String, Bucket> apiRateLimitCache() {
        return new ConcurrentHashMap<>();
    }

    /**
     * Create authentication rate limit bucket
     * 5 requests per minute with burst allowance
     */
    public static Bucket createAuthBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                .build();
    }

    /**
     * Create API rate limit bucket
     * 200 requests per minute (generous for legit dashboards)
     */
    public static Bucket createApiBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(200, Refill.intervally(200, Duration.ofMinutes(1))))
                .build();
    }
}