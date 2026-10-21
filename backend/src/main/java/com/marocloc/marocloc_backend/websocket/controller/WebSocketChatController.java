package com.marocloc.marocloc_backend.websocket.controller;

import com.marocloc.marocloc_backend.dto.MessageDTO;
import com.marocloc.marocloc_backend.service.MessageService;
import com.marocloc.marocloc_backend.websocket.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.time.ZoneId;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,
                            @Payload ChatMessage message,
                            Principal principal) {
        if (principal == null) {
            log.warn("Unauthorized chat attempt on room {}", roomId);
            return;
        }

        if (message.getReceiverId() == null || message.getContent() == null) {
            log.warn("Incomplete chat message in room {}", roomId);
            return;
        }

        message.setRoomId(roomId);
        message.setType(ChatMessage.MessageType.CHAT);
        message.setRead(false);

        try {
            MessageDTO saved = messageService.sendMessage(
                    principal.getName(),
                    message.getReceiverId(),
                    message.getContent(),
                    message.getPropertyId()
            );
            message.setId(saved.getId());
            message.setSenderId(saved.getSenderId());
            message.setSenderName(saved.getSenderName());
            message.setReceiverId(saved.getReceiverId());
            message.setPropertyId(saved.getPropertyId());
            message.setTimestamp(saved.getTimestamp() != null
                    ? saved.getTimestamp().atZone(ZoneId.systemDefault()).toInstant()
                    : Instant.now());
        } catch (Exception e) {
            log.warn("Failed to persist WebSocket chat message: {}", e.getMessage());
            message.setTimestamp(Instant.now());
        }

        messagingTemplate.convertAndSend("/topic/chat." + roomId, message);

        if (message.getReceiverId() != null) {
            messagingTemplate.convertAndSendToUser(
                    message.getReceiverId().toString(),
                    "/queue/notifications",
                    message
            );
        }

        log.debug("Message sent to room {} from user {}", roomId, principal.getName());
    }

    @MessageMapping("/chat.typing/{roomId}")
    public void typingIndicator(@DestinationVariable Long roomId,
                                @Payload ChatMessage message,
                                Principal principal) {
        if (principal == null) {
            log.warn("Unauthorized typing attempt on room {}", roomId);
            return;
        }

        message.setType(ChatMessage.MessageType.TYPING);
        message.setRoomId(roomId);
        if (message.getIsTyping() == null) {
            message.setIsTyping(true);
        }
        message.setTimestamp(Instant.now());
        messagingTemplate.convertAndSend("/topic/chat.typing." + roomId, message);
    }

    @MessageMapping("/chat.read/{roomId}")
    public void readReceipt(@DestinationVariable Long roomId,
                            @Payload ChatMessage message,
                            Principal principal) {
        if (principal == null) {
            log.warn("Unauthorized read receipt attempt on room {}", roomId);
            return;
        }

        if (message.getId() != null) {
            try {
                messageService.markAsRead(message.getId(), principal.getName());
            } catch (Exception e) {
                log.warn("Failed to persist read receipt for message {}: {}", message.getId(), e.getMessage());
            }
        }

        message.setType(ChatMessage.MessageType.READ_RECEIPT);
        message.setRoomId(roomId);
        message.setTimestamp(Instant.now());
        messagingTemplate.convertAndSend("/topic/chat.read." + roomId, message);
    }

    @org.springframework.messaging.simp.annotation.SubscribeMapping("/chat.history/{roomId}")
    public void subscribeToRoom(@DestinationVariable Long roomId, Principal principal) {
        log.debug("User {} subscribed to room {}", principal.getName(), roomId);
    }
}
