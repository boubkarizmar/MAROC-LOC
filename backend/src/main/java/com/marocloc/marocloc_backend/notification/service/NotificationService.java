package com.marocloc.marocloc_backend.notification.service;

import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.dto.*;
import com.marocloc.marocloc_backend.notification.event.NotificationCreatedEvent;
import com.marocloc.marocloc_backend.notification.fcm.FcmService;
import com.marocloc.marocloc_backend.notification.mapper.NotificationMapper;
import com.marocloc.marocloc_backend.notification.model.Notification;
import com.marocloc.marocloc_backend.notification.model.NotificationPreference;
import com.marocloc.marocloc_backend.notification.model.NotificationPriority;
import com.marocloc.marocloc_backend.notification.model.NotificationStatus;
import com.marocloc.marocloc_backend.notification.model.NotificationType;
import com.marocloc.marocloc_backend.notification.repository.NotificationPreferenceRepository;
import com.marocloc.marocloc_backend.notification.repository.NotificationRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final FcmService fcmService;

    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .type(parseType(request.getType()))
                .priority(parsePriority(request.getPriority()))
                .icon(request.getIcon())
                .userId(request.getUserId())
                .senderId(request.getSenderId())
                .role(parseRole(request.getRole()))
                .entityId(request.getEntityId())
                .entityType(request.getEntityType())
                .actionUrl(request.getActionUrl())
                .metadata(request.getMetadata())
                .status(NotificationStatus.UNREAD)
                .build();

        resolveUser(notification);
        Notification saved = notificationRepository.save(notification);

        // Skip in-app event and push if user disabled in-app/push (preferences are best-effort)
        if (shouldDeliverInApp(saved.getUserId())) {
            eventPublisher.publishEvent(new NotificationCreatedEvent(this, saved));
        }
        if (shouldDeliverPush(saved.getUserId())) {
            fcmService.sendPush(saved.getUserId(), saved.getTitle(), saved.getMessage(), saved.getActionUrl());
        }

        return notificationMapper.toResponse(saved);
    }

    @Transactional
    public Notification createFromTemplate(Notification notification) {
        if (notification == null) {
            return null;
        }
        resolveUser(notification);
        Notification saved = notificationRepository.save(notification);
        if (shouldDeliverInApp(saved.getUserId())) {
            eventPublisher.publishEvent(new NotificationCreatedEvent(this, saved));
        }
        if (shouldDeliverPush(saved.getUserId())) {
            fcmService.sendPush(saved.getUserId(), saved.getTitle(), saved.getMessage(), saved.getActionUrl());
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Long userId, NotificationStatus status, NotificationType type, String search, Pageable pageable) {
        String likePattern = wrapSearch(search);
        Page<Notification> page = notificationRepository.findByUserIdAndFilters(userId, status, type, likePattern, pageable);
        return page.map(notificationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getAllNotifications(NotificationStatus status, NotificationType type, Role role, String search, Pageable pageable) {
        String likePattern = wrapSearch(search);
        Page<Notification> page = notificationRepository.findAllByFilters(status, type, role, likePattern, pageable);
        return page.map(notificationMapper::toResponse);
    }

    private String wrapSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String trimmed = search.trim().toLowerCase();
        return "%" + trimmed + "%";
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadByUserId(userId, LocalDateTime.now());
    }

    @Transactional
    public void deleteNotification(Long id, Long userId) {
        notificationRepository.softDeleteByIdAndUserId(id, userId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public NotificationStatsResponse getStats(Long userId) {
        long unread = notificationRepository.countUnreadByUserId(userId);
        long total = notificationRepository.countByUserId(userId);
        long read = total - unread;
        Map<String, Long> byType = notificationRepository.countByTypeForUser(userId).stream()
                .collect(Collectors.toMap(
                        row -> row[0] != null ? row[0].toString() : "UNKNOWN",
                        row -> row[1] != null ? ((Number) row[1]).longValue() : 0L
                ));
        return NotificationStatsResponse.builder()
                .total(total)
                .unread(unread)
                .read(read)
                .byType(byType)
                .build();
    }

    @Transactional(readOnly = true)
    public NotificationStatsResponse getGlobalStats() {
        long total = notificationRepository.countAllActive();
        long unread = notificationRepository.countByStatus(NotificationStatus.UNREAD);
        Map<String, Long> byType = notificationRepository.countByTypeGlobal().stream()
                .collect(Collectors.toMap(
                        row -> row[0] != null ? row[0].toString() : "UNKNOWN",
                        row -> row[1] != null ? ((Number) row[1]).longValue() : 0L
                ));
        return NotificationStatsResponse.builder()
                .total(total)
                .unread(unread)
                .read(total - unread)
                .byType(byType)
                .build();
    }

    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreference(Long userId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreference(userId));
        return notificationMapper.toResponse(pref);
    }

    @Transactional
    public NotificationPreferenceResponse updatePreference(Long userId, UpdateNotificationPreferenceRequest request) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreference(userId));
        if (request.getEmailEnabled() != null) pref.setEmailEnabled(request.getEmailEnabled());
        if (request.getPushEnabled() != null) pref.setPushEnabled(request.getPushEnabled());
        if (request.getSmsEnabled() != null) pref.setSmsEnabled(request.getSmsEnabled());
        if (request.getInAppEnabled() != null) pref.setInAppEnabled(request.getInAppEnabled());
        if (request.getQuietHoursStart() != null) pref.setQuietHoursStart(request.getQuietHoursStart());
        if (request.getQuietHoursEnd() != null) pref.setQuietHoursEnd(request.getQuietHoursEnd());
        return notificationMapper.toResponse(preferenceRepository.save(pref));
    }

    private NotificationPreference createDefaultPreference(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        return preferenceRepository.save(NotificationPreference.builder()
                .user(user)
                .emailEnabled(true)
                .pushEnabled(true)
                .smsEnabled(false)
                .inAppEnabled(true)
                .build());
    }

    private void resolveUser(Notification notification) {
        if (notification.getUserId() != null) {
            userRepository.findById(notification.getUserId()).ifPresent(notification::setUser);
        }
        if (notification.getSenderId() != null) {
            userRepository.findById(notification.getSenderId()).ifPresent(notification::setSender);
        }
    }

    private boolean shouldDeliverInApp(Long userId) {
        if (userId == null) return true; // role-targeted notifications
        return preferenceRepository.findByUserId(userId)
                .map(p -> p.getInAppEnabled() == null || p.getInAppEnabled())
                .orElse(true);
    }

    private boolean shouldDeliverPush(Long userId) {
        if (userId == null) return false;
        return preferenceRepository.findByUserId(userId)
                .map(p -> p.getPushEnabled() != null && p.getPushEnabled())
                .orElse(true);
    }

    private NotificationType parseType(String value) {
        return value != null ? NotificationType.valueOf(value.toUpperCase()) : NotificationType.SYSTEM_ANNOUNCEMENT;
    }

    private NotificationPriority parsePriority(String value) {
        return value != null ? NotificationPriority.valueOf(value.toUpperCase()) : NotificationPriority.NORMAL;
    }

    private Role parseRole(String value) {
        return value != null ? Role.valueOf(value.toUpperCase()) : null;
    }
}
