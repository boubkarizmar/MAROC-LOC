package com.marocloc.marocloc_backend.security;

import com.marocloc.marocloc_backend.service.AuditService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Rate Limit Filter Tests")
class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;
    private ConcurrentHashMap<String, Bucket> authRateLimitCache;
    private ConcurrentHashMap<String, Bucket> apiRateLimitCache;

    @Mock
    private AuditService auditService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        authRateLimitCache = new ConcurrentHashMap<>();
        apiRateLimitCache = new ConcurrentHashMap<>();
        rateLimitFilter = new RateLimitFilter(authRateLimitCache, apiRateLimitCache, auditService);
    }

    @Test
    @DisplayName("Should allow request within rate limit")
    void shouldAllowRequestWithinRateLimit() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v2/properties");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("Should bypass rate limiting for static media")
    void shouldBypassRateLimitingForStaticMedia() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/videos/sample.mp4");
        when(request.getRemoteAddr()).thenReturn("192.168.1.3");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("Should use X-Forwarded-For header for client IP")
    void shouldUseXForwardedForHeader() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v2/properties");
        when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1, 192.168.1.1");

        rateLimitFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }
}
