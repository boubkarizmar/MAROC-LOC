package com.marocloc.marocloc_backend.websocket.controller;

import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.websocket.dto.NotificationMessage;
import com.marocloc.marocloc_backend.websocket.dto.PresenceUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketNotificationController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final Map<Long, PresenceUpdate> presenceMap = new ConcurrentHashMap<>();

    @MessageMapping("/presence")
    public void updatePresence(@Payload PresenceUpdate update, Principal principal) {
        if (principal == null) return;

        try {
            Long userId = userRepository.findByEmail(principal.getName())
                    .map(u -> u.getId())
                    .orElseThrow(() -> new NumberFormatException("User not found: " + principal.getName()));
            update.setUserId(userId);
            update.setLastSeen(Instant.now());
            presenceMap.put(userId, update);

            messagingTemplate.convertAndSend("/topic/presence", update);
        } catch (NumberFormatException e) {
            log.warn("Invalid principal name for presence: {}", principal.getName());
        }
    }

    public void sendNotification(Long userId, NotificationMessage message) {
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                message
        );
    }

    public void broadcastNotification(NotificationMessage message) {
        messagingTemplate.convertAndSend("/topic/notifications.broadcast", message);
    }

    public void sendPriceDropAlert(Long userId, Long propertyId, Double oldPrice, Double newPrice) {
        double discount = ((oldPrice - newPrice) / oldPrice) * 100;
        NotificationMessage notification = NotificationMessage.builder()
                .id("price-" + propertyId + "-" + System.currentTimeMillis())
                .type(NotificationMessage.NotificationType.PRICE_DROP)
                .userId(userId)
                .title("Réduction de prix !")
                .body(String.format("Le prix a baissé de %.0f%% (%.0f → %.0f MAD)", discount, oldPrice, newPrice))
                .actionUrl("/property/" + propertyId)
                .timestamp(Instant.now())
                .read(false)
                .build();

        sendNotification(userId, notification);
    }

    @Scheduled(fixedRate = 60000)
    public void cleanupStalePresence() {
        Instant cutoff = Instant.now().minusSeconds(300);
        presenceMap.entrySet().removeIf(entry ->
                entry.getValue().getLastSeen().isBefore(cutoff));
    }

    public PresenceUpdate.Status getUserStatus(Long userId) {
        PresenceUpdate update = presenceMap.get(userId);
        if (update == null) return PresenceUpdate.Status.OFFLINE;

        Instant fiveMinAgo = Instant.now().minusSeconds(300);
        if (update.getLastSeen().isBefore(fiveMinAgo)) {
            return PresenceUpdate.Status.OFFLINE;
        }
        return update.getStatus();
    }
}
