package com.marocloc.marocloc_backend.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private String type;
    private String priority;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private Long userId;
    private Long senderId;
    private String senderName;
    private String role;
    private Long entityId;
    private String entityType;
    private String actionUrl;
    private String status;
    private Map<String, Object> metadata;
}
