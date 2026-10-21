package com.marocloc.marocloc_backend.notification.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.notification.dto.*;
import com.marocloc.marocloc_backend.notification.model.NotificationStatus;
import com.marocloc.marocloc_backend.notification.model.NotificationType;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiRoutes.NOTIFICATIONS)
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = resolveUserId(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationResponse> result = notificationService.getMyNotifications(userId, status, type, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result, "Notifications retrieved"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(userId), "Unread count retrieved"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAsRead(id, userId), "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAllAsRead(userId), "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = resolveUserId(userDetails);
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification deleted"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<NotificationStatsResponse>> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(notificationService.getStats(userId), "Notification stats retrieved"));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> getPreferences(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(notificationService.getPreference(userId), "Preferences retrieved"));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> updatePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateNotificationPreferenceRequest request) {
        Long userId = resolveUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(notificationService.updatePreference(userId, request), "Preferences updated"));
    }

    // =================== ADMIN ===================
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getAllNotifications(
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationResponse> result = notificationService.getAllNotifications(status, type, role, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result, "All notifications retrieved"));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<NotificationStatsResponse>> getGlobalStats() {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getGlobalStats(), "Global stats retrieved"));
    }
}
