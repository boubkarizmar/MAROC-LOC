package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.dto.ApprovePropertyRequest;
import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.dto.RejectPropertyRequest;
import com.marocloc.marocloc_backend.dto.UserDTO;
import com.marocloc.marocloc_backend.dto.UserAdminDTO;
import com.marocloc.marocloc_backend.dto.VerifyUserRequest;
import com.marocloc.marocloc_backend.event.model.EventLog;
import com.marocloc.marocloc_backend.event.repository.EventLogRepository;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.FavoriteRepository;
import com.marocloc.marocloc_backend.repository.MessageRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.PropertyVisitRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin controller with strict role-based access control
 * All endpoints restricted to ADMIN role only
 * FIXED: All user responses now use DTOs to prevent PII leakage
 * FIXED: Statistics use COUNT queries instead of loading entire tables
 */
@Slf4j
@RestController
@RequestMapping(ApiRoutes.ADMIN)
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SuppressWarnings("null")
public class AdminController {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final MessageRepository messageRepository;
    private final FavoriteRepository favoriteRepository;
    private final PropertyVisitRepository propertyVisitRepository;
    private final EventLogRepository eventLogRepository;
    private final NotificationService notificationService;
    private final com.marocloc.marocloc_backend.service.AdvertisementService advertisementService;
    private final Optional<com.marocloc.marocloc_backend.config.DatabaseSeeder> databaseSeeder;

    /**
     * Get all users - returns DTOs only, no password hashes
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);
        return ResponseEntity.ok(users.map(this::mapUserToAdminDTO));
    }

    /**
     * Get user by ID - returns DTO only
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserAdminDTO> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(this::mapUserToAdminDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete user
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all unverified users
     */
    @GetMapping("/users/unverified")
    public ResponseEntity<Page<UserDTO>> getUnverifiedUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var unverifiedPage = userRepository.findByIsVerifiedFalse(PageRequest.of(page, size));
        var dtoPage = unverifiedPage.map(this::mapUserToDTO);
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * Verify a user account
     */
    @PostMapping("/users/verify")
    public ResponseEntity<UserDTO> verifyUser(@Valid @RequestBody VerifyUserRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundException("User", request.getUserId()));

        user.setIsVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User updated = userRepository.save(user);
        return ResponseEntity.ok(mapUserToDTO(updated));
    }

    /**
     * Delete any property (Admin override)
     */
    @DeleteMapping("/properties/{id}")
    public ResponseEntity<Void> deleteAnyProperty(@PathVariable Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new NotFoundException("Property", id);
        }
        propertyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all pending properties waiting for approval
     * FIXED: Uses repository query instead of loading entire table
     */
    @GetMapping("/properties/pending")
    public ResponseEntity<Page<PropertyDTO>> getPendingProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Property> pending = propertyRepository.findByStatus(PropertyStatus.PENDING, pageable);
        return ResponseEntity.ok(pending.map(this::mapPropertyToDTO));
    }

    /**
     * Approve a property listing
     */
    @PostMapping("/properties/approve")
    @Transactional
    public ResponseEntity<PropertyDTO> approveProperty(@Valid @RequestBody ApprovePropertyRequest request) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new NotFoundException("Property", request.getPropertyId()));

        property.setStatus(PropertyStatus.APPROVED);
        property.setApprovedAt(LocalDateTime.now());
        property.setIsVerified(true);
        property.setUpdatedAt(LocalDateTime.now());

        Property updated = propertyRepository.save(property);
        notificationService.createFromTemplate(NotificationTemplate.propertyApproved(updated.getOwner().getId(), updated.getId(), updated.getTitle()));
        return ResponseEntity.ok(mapPropertyToDTO(updated));
    }

    /**
     * Reject a property listing with reason
     */
    @PostMapping("/properties/reject")
    @Transactional
    public ResponseEntity<PropertyDTO> rejectProperty(@Valid @RequestBody RejectPropertyRequest request) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new NotFoundException("Property", request.getPropertyId()));

        property.setStatus(PropertyStatus.REJECTED);
        property.setRejectionReason(request.getReason());
        property.setUpdatedAt(LocalDateTime.now());

        Property updated = propertyRepository.save(property);
        notificationService.createFromTemplate(NotificationTemplate.propertyRejected(updated.getOwner().getId(), updated.getId(), updated.getTitle(), request.getReason()));
        return ResponseEntity.ok(mapPropertyToDTO(updated));
    }

    /**
     * Platform statistics
     * FIXED: Uses COUNT queries instead of loading entire tables into memory
     */
    @GetMapping("/stats")
    public ResponseEntity<PlatformStats> getPlatformStats() {
        long totalUsers = userRepository.count();
        long totalProperties = propertyRepository.count();
        long pendingProperties = propertyRepository.countByStatus(PropertyStatus.PENDING);
        long verifiedUsers = userRepository.countByIsVerifiedTrue();

        return ResponseEntity.ok(new PlatformStats(totalUsers, totalProperties, pendingProperties, verifiedUsers));
    }

    /**
     * Enhanced platform statistics with revenue, engagement, and conversion metrics
     */
    @GetMapping("/stats/enhanced")
    public ResponseEntity<Map<String, Object>> getEnhancedPlatformStats() {
        long totalUsers = userRepository.count();
        long totalProperties = propertyRepository.count();
        long pendingProperties = propertyRepository.countByStatus(PropertyStatus.PENDING);
        long approvedProperties = propertyRepository.countByStatus(PropertyStatus.APPROVED);
        long availableProperties = propertyRepository.countByStatus(PropertyStatus.AVAILABLE);
        long verifiedUsers = userRepository.countByIsVerifiedTrue();
        long totalMessages = messageRepository.count();
        long totalFavorites = favoriteRepository.count();
        long totalVisits = propertyVisitRepository.count();

        // Daily properties (last 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long newPropertiesThisWeek = propertyRepository.countByCreatedAtAfter(sevenDaysAgo);

        // Top cities
        List<Map<String, Object>> topCities = propertyRepository.getCityAggregation().stream()
                .limit(10)
                .map(row -> Map.of(
                        "name", row[0],
                        "count", ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        // User roles breakdown
        Map<String, Long> usersByRole = userRepository.findAll().stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalProperties", totalProperties);
        stats.put("pendingProperties", pendingProperties);
        stats.put("approvedProperties", approvedProperties);
        stats.put("availableProperties", availableProperties);
        stats.put("verifiedUsers", verifiedUsers);
        stats.put("totalMessages", totalMessages);
        stats.put("totalFavorites", totalFavorites);
        stats.put("totalVisits", totalVisits);
        stats.put("newPropertiesThisWeek", newPropertiesThisWeek);
        stats.put("topCities", topCities);
        stats.put("usersByRole", usersByRole);
        double rawRate = totalProperties > 0 ? (double) totalVisits / totalProperties : 0.0;
        stats.put("conversionRate", Math.min(Math.round(rawRate * 100.0) / 100.0, 1.0));

        return ResponseEntity.ok(stats);
    }

    /**
     * Get daily property publishing stats for charting
     */
    @GetMapping("/stats/daily-properties")
    public ResponseEntity<List<Map<String, Object>>> getDailyPropertyStats(
            @RequestParam(defaultValue = "30") int days) {
        LocalDateTime start = LocalDateTime.now().minusDays(days);
        List<Object[]> results = propertyRepository.countPropertiesByDay(start);

        List<Map<String, Object>> dailyStats = results.stream()
                .map(row -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("date", row[0].toString());
                    map.put("count", ((Number) row[1]).longValue());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(dailyStats);
    }

    /**
     * Get all properties with full admin control (filter by status)
     */
    @GetMapping("/properties")
    public ResponseEntity<Page<PropertyDTO>> getAllProperties(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Property> properties;
        if (status != null && !status.isEmpty()) {
            try {
                PropertyStatus ps = PropertyStatus.valueOf(status.toUpperCase());
                properties = propertyRepository.findByStatus(ps, pageable);
            } catch (IllegalArgumentException e) {
                properties = propertyRepository.findByStatusIn(Arrays.asList(PropertyStatus.values()), pageable);
            }
        } else {
            properties = propertyRepository.findByStatusIn(Arrays.asList(PropertyStatus.values()), pageable);
        }
        return ResponseEntity.ok(properties.map(this::mapPropertyToDTO));
    }

    /**
     * Classify a property (verified / premium / normal)
     */
    @PutMapping("/properties/{id}/classify")
    public ResponseEntity<PropertyDTO> classifyProperty(
            @PathVariable Long id,
            @RequestParam String classification) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property", id));

        // classification affects isVerified and potentially other flags
        property.setIsVerified("verified".equalsIgnoreCase(classification) || "premium".equalsIgnoreCase(classification));
        property.setUpdatedAt(LocalDateTime.now());
        Property updated = propertyRepository.save(property);
        return ResponseEntity.ok(mapPropertyToDTO(updated));
    }

    /**
     * Get event logs for platform monitoring
     */
    @GetMapping("/events")
    public ResponseEntity<Page<EventLog>> getEventLogs(
            @RequestParam(required = false) String eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<EventLog> logs;
        if (eventType != null && !eventType.isEmpty()) {
            logs = eventLogRepository.findByEventTypeOrderByServerTimestampDesc(eventType, pageable);
        } else {
            logs = eventLogRepository.findAll(pageable);
        }
        return ResponseEntity.ok(logs);
    }

    /**
     * Get engagement summary from event logs
     */
    @GetMapping("/events/summary")
    public ResponseEntity<Map<String, Object>> getEventSummary(
            @RequestParam(defaultValue = "7") int days) {
        Instant since = Instant.now().minusSeconds(days * 86400L);
        Object[] summary = eventLogRepository.getEngagementSummary(since);

        Map<String, Object> result = new HashMap<>();
        if (summary != null && summary.length >= 3) {
            result.put("uniqueUsers", summary[0] != null ? ((Number) summary[0]).longValue() : 0);
            result.put("totalEvents", summary[1] != null ? ((Number) summary[1]).longValue() : 0);
            result.put("sessions", summary[2] != null ? ((Number) summary[2]).longValue() : 0);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Get top viewed properties from event logs
     */
    @GetMapping("/events/top-viewed")
    public ResponseEntity<List<Map<String, Object>>> getTopViewedProperties(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit) {
        Instant since = Instant.now().minusSeconds(days * 86400L);
        List<Object[]> results = eventLogRepository.findTopViewedProperties(since, limit);

        List<Map<String, Object>> topViewed = results.stream()
                .map(row -> Map.of(
                        "propertyId", row[0],
                        "views", ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(topViewed);
    }

    /**
     * DTO for stats
     */
    public record PlatformStats(long totalUsers, long totalProperties, long pendingProperties, long verifiedUsers) {}

    // ========================
    // HELPER METHODS
    // ========================

    private PropertyDTO mapPropertyToDTO(Property property) {
        return PropertyDTO.builder()
                .id(property.getId())
                .title(property.getTitle())
                .description(property.getDescription())
                .price(property.getPrice())
                .city(property.getCity())
                .address(property.getAddress())
                .type(property.getType())
                .status(property.getStatus())
                .images(property.getImages())
                .latitude(property.getLatitude())
                .longitude(property.getLongitude())
                .ownerId(property.getOwner().getId())
                .ownerName(property.getOwner().getName())
                .createdAt(property.getCreatedAt())
                .updatedAt(property.getUpdatedAt())
                .approvedAt(property.getApprovedAt())
                .rejectionReason(property.getRejectionReason())
                .build();
    }

    private UserDTO mapUserToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstNameArabic(user.getFirstNameArabic())
                .lastNameArabic(user.getLastNameArabic())
                .firstNameLatin(user.getFirstNameLatin())
                .lastNameLatin(user.getLastNameLatin())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .city(user.getCity())
                .isVerified(user.getIsVerified())
                .verifiedAt(user.getVerifiedAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Get all advertisements (admin view)
     */
    @GetMapping("/ads")
    public ResponseEntity<List<com.marocloc.marocloc_backend.dto.AdvertisementDTO>> getAllAds() {
        return ResponseEntity.ok(advertisementService.getAllAds());
    }

    /**
     * Seed the database with realistic test data
     * Only works when database is empty
     */
    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> seedDatabase() {
        try {
            databaseSeeder.ifPresent(seeder -> seeder.seedAll(true));
            return ResponseEntity.ok(Map.of("status", "success", "message", "Database seeded successfully"));
        } catch (Exception e) {
            log.error("Seeding failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/seed-missing")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> seedMissingData() {
        try {
            databaseSeeder.ifPresent(com.marocloc.marocloc_backend.config.DatabaseSeeder::seedMissingOnly);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Missing data seeded successfully"));
        } catch (Exception e) {
            log.error("Missing seeding failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Ban a user
     */
    @PostMapping("/users/{id}/ban")
    public ResponseEntity<UserAdminDTO> banUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User", id));
        user.setIsBanned(true);
        user.setBannedAt(LocalDateTime.now());
        user.setBanReason(request != null ? request.get("reason") : null);
        user.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(mapUserToAdminDTO(userRepository.save(user)));
    }

    /**
     * Unban a user
     */
    @PostMapping("/users/{id}/unban")
    public ResponseEntity<UserAdminDTO> unbanUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User", id));
        user.setIsBanned(false);
        user.setBannedAt(null);
        user.setBanReason(null);
        user.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(mapUserToAdminDTO(userRepository.save(user)));
    }

    /**
     * Change user role
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserAdminDTO> changeUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User", id));
        String roleStr = request.get("role");
        if (roleStr != null) {
            try {
                user.setRole(com.marocloc.marocloc_backend.model.Role.valueOf(roleStr.toUpperCase()));
                user.setUpdatedAt(LocalDateTime.now());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + roleStr);
            }
        }
        return ResponseEntity.ok(mapUserToAdminDTO(userRepository.save(user)));
    }

    /**
     * Admin-safe DTO that excludes sensitive fields like password hash
     */
    private UserAdminDTO mapUserToAdminDTO(User user) {
        return UserAdminDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phoneNumber(user.getPhoneNumber())
                .city(user.getCity())
                .isVerified(user.getIsVerified())
                .verifiedAt(user.getVerifiedAt())
                .createdAt(user.getCreatedAt())
                .isBanned(user.getIsBanned())
                .bannedAt(user.getBannedAt())
                .banReason(user.getBanReason())
                .build();
    }
}
