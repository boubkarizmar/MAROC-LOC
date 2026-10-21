package com.marocloc.marocloc_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Security audit logging service
 * Logs all security-related events for compliance and monitoring
 */
@Service
@Slf4j
public class AuditService {

    /**
     * Log authentication events
     */
    public void logAuthenticationEvent(String event, String username, String ipAddress, boolean success, String details) {
        log.info("AUTH_EVENT: {} | User: {} | IP: {} | Success: {} | Details: {} | Timestamp: {}",
                event, username, ipAddress, success, details, LocalDateTime.now());
    }

    /**
     * Log authorization failures
     */
    public void logAuthorizationFailure(String username, String resource, String action, String ipAddress) {
        log.warn("AUTHZ_FAILURE: User: {} | Resource: {} | Action: {} | IP: {} | Timestamp: {}",
                username, resource, action, ipAddress, LocalDateTime.now());
    }

    /**
     * Log rate limit events
     */
    public void logRateLimitEvent(String ipAddress, String endpoint, int remainingTokens) {
        log.warn("RATE_LIMIT: IP: {} | Endpoint: {} | Remaining: {} | Timestamp: {}",
                ipAddress, endpoint, remainingTokens, LocalDateTime.now());
    }

    /**
     * Log file upload events
     */
    public void logFileUploadEvent(String username, String filename, long fileSize, String contentType, boolean success) {
        log.info("FILE_UPLOAD: User: {} | File: {} | Size: {} | Type: {} | Success: {} | Timestamp: {}",
                username, filename, fileSize, contentType, success, LocalDateTime.now());
    }

    /**
     * Log suspicious activities
     */
    public void logSuspiciousActivity(String activity, String identifier, String details, String ipAddress) {
        log.error("SUSPICIOUS_ACTIVITY: {} | ID: {} | Details: {} | IP: {} | Timestamp: {}",
                activity, identifier, details, ipAddress, LocalDateTime.now());
    }

    /**
     * Log security configuration changes
     */
    public void logSecurityConfigChange(String change, String user, Map<String, Object> details) {
        log.info("SECURITY_CONFIG_CHANGE: {} | User: {} | Details: {} | Timestamp: {}",
                change, user, details, LocalDateTime.now());
    }

    /**
     * Log token events (issuance, refresh, revocation)
     */
    public void logTokenEvent(String event, String username, String tokenType, boolean success) {
        log.info("TOKEN_EVENT: {} | User: {} | Type: {} | Success: {} | Timestamp: {}",
                event, username, tokenType, success, LocalDateTime.now());
    }
}