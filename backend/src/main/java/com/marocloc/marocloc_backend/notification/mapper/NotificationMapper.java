package com.marocloc.marocloc_backend.notification.mapper;

import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.dto.NotificationPreferenceResponse;
import com.marocloc.marocloc_backend.notification.dto.NotificationResponse;
import com.marocloc.marocloc_backend.notification.model.Notification;
import com.marocloc.marocloc_backend.notification.model.NotificationPriority;
import com.marocloc.marocloc_backend.notification.model.NotificationStatus;
import com.marocloc.marocloc_backend.notification.model.NotificationType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) {
            return null;
        }
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .priority(notification.getPriority() != null ? notification.getPriority().name() : NotificationPriority.NORMAL.name())
                .icon(notification.getIcon())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .userId(notification.getUserId())
                .senderId(notification.getSenderId())
                .senderName(notification.getSender() != null ? notification.getSender().getName() : null)
                .role(notification.getRole() != null ? notification.getRole().name() : null)
                .entityId(notification.getEntityId())
                .entityType(notification.getEntityType())
                .actionUrl(notification.getActionUrl())
                .status(notification.getStatus() != null ? notification.getStatus().name() : NotificationStatus.UNREAD.name())
                .metadata(notification.getMetadata())
                .build();
    }

    public List<NotificationResponse> toResponseList(List<Notification> notifications) {
        if (notifications == null) {
            return List.of();
        }
        return notifications.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public com.marocloc.marocloc_backend.websocket.dto.NotificationMessage toWebSocketMessage(Notification notification) {
        if (notification == null) {
            return null;
        }
        return com.marocloc.marocloc_backend.websocket.dto.NotificationMessage.builder()
                .id(notification.getId() != null ? notification.getId().toString() : null)
                .type(mapTypeToLegacy(notification.getType()))
                .userId(notification.getUserId())
                .title(notification.getTitle())
                .body(notification.getMessage())
                .actionUrl(notification.getActionUrl())
                .imageUrl(notification.getIcon())
                .timestamp(notification.getCreatedAt() != null ? notification.getCreatedAt().toInstant(java.time.ZoneOffset.UTC) : null)
                .read(notification.getStatus() == NotificationStatus.READ)
                .build();
    }

    private com.marocloc.marocloc_backend.websocket.dto.NotificationMessage.NotificationType mapTypeToLegacy(NotificationType type) {
        if (type == null) {
            return com.marocloc.marocloc_backend.websocket.dto.NotificationMessage.NotificationType.SYSTEM_ANNOUNCEMENT;
        }
        try {
            return com.marocloc.marocloc_backend.websocket.dto.NotificationMessage.NotificationType.valueOf(type.name());
        } catch (IllegalArgumentException e) {
            return com.marocloc.marocloc_backend.websocket.dto.NotificationMessage.NotificationType.SYSTEM_ANNOUNCEMENT;
        }
    }

    public NotificationPreferenceResponse toResponse(com.marocloc.marocloc_backend.notification.model.NotificationPreference preference) {
        if (preference == null) {
            return null;
        }
        return NotificationPreferenceResponse.builder()
                .id(preference.getId())
                .userId(preference.getUser() != null ? preference.getUser().getId() : null)
                .emailEnabled(preference.getEmailEnabled())
                .pushEnabled(preference.getPushEnabled())
                .smsEnabled(preference.getSmsEnabled())
                .inAppEnabled(preference.getInAppEnabled())
                .quietHoursStart(preference.getQuietHoursStart())
                .quietHoursEnd(preference.getQuietHoursEnd())
                .build();
    }

    public void updateUserReference(Notification notification, Long userId, User user) {
        notification.setUser(user);
        notification.setUserId(userId);
    }
}
