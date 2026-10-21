package com.marocloc.marocloc_backend.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    public enum MessageType {
        CHAT, JOIN, LEAVE, TYPING, READ_RECEIPT
    }

    private MessageType type;
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private Long roomId;
    private String content;
    private Long propertyId;
    private Instant timestamp;
    private Boolean read;
    private Boolean isTyping;
}
