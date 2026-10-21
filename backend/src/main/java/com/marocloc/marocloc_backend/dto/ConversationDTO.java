package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDTO {

    private Long partnerId;
    private String partnerName;
    private String partnerAvatar;
    private String partnerRole;
    private String lastMessage;
    private LocalDateTime lastMessageDate;
    private long unreadCount;
    private Long propertyId;
    private String propertyTitle;
}
