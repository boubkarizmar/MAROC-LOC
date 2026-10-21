package com.marocloc.marocloc_backend.security;

import com.marocloc.marocloc_backend.config.RateLimitConfig;
import com.marocloc.marocloc_backend.service.AuditService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter to protect API from abuse
 */@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, Bucket> authRateLimitCache;
    private final ConcurrentHashMap<String, Bucket> apiRateLimitCache;
    private final AuditService auditService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        String uri = request.getRequestURI();

        // 🔥 BYPASS ALL STATIC MEDIA (IMPORTANT FIX)
        if (isPublicMedia(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // AUTH RATE LIMIT
        if (uri.startsWith("/api/auth/")) {
            Bucket bucket = authRateLimitCache.computeIfAbsent(ip,
                    k -> RateLimitConfig.createAuthBucket());

            if (!bucket.tryConsume(1)) {
                response.setStatus(429);
                response.getWriter().write("{\"error\":\"Too many requests\"}");
                return;
            }
        }

        // GENERAL API RATE LIMIT
        else if (uri.startsWith("/api/")) {
            Bucket bucket = apiRateLimitCache.computeIfAbsent(ip,
                    k -> RateLimitConfig.createApiBucket());

            if (!bucket.tryConsume(1)) {
                response.setStatus(429);
                response.getWriter().write("{\"error\":\"Too many requests\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    // ✅ FINAL FIX HERE
    private boolean isPublicMedia(String uri) {
        return uri.startsWith("/api/videos/")
                || uri.startsWith("/videos/")
                || uri.startsWith("/uploads/")
                || uri.startsWith("/api/uploads/")
                || uri.startsWith("/media/")
                || uri.matches(".*\\.(mp4|jpg|jpeg|png|gif|webp)$");
    }

    private String getClientIP(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null) return xf.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}