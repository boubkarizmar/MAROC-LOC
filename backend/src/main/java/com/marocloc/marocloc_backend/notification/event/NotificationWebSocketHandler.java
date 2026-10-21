package com.marocloc.marocloc_backend.notification.event;

import com.marocloc.marocloc_backend.notification.mapper.NotificationMapper;
import com.marocloc.marocloc_backend.notification.model.Notification;
import com.marocloc.marocloc_backend.websocket.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationMapper notificationMapper;

    @Async
    @EventListener
    public void onNotificationCreated(NotificationCreatedEvent event) {
        Notification notification = event.getNotification();
        NotificationMessage message = notificationMapper.toWebSocketMessage(notification);

        if (notification.getUserId() != null) {
            messagingTemplate.convertAndSendToUser(
                    notification.getUserId().toString(),
                    "/queue/notifications",
                    message
            );
            log.debug("Sent real-time notification to user {}: {}", notification.getUserId(), notification.getType());
        }

        if (notification.getRole() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + notification.getRole().name().toLowerCase(),
                    message
            );
        }
    }
}
