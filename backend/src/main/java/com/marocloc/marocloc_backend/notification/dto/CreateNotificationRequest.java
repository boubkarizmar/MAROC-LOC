package com.marocloc.marocloc_backend.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CreateNotificationRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    @NotBlank
    private String type;

    private String priority;
    private String icon;

    private Long userId;
    private Long senderId;
    private String role;

    private Long entityId;
    private String entityType;
    private String actionUrl;

    private Map<String, Object> metadata;
}
