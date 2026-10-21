package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {

    private Long id;

    @NotNull
    private Long senderId;
    private String senderName;
    private String senderRole;

    @NotNull
    private Long receiverId;
    private String receiverName;
    private String receiverRole;

    @NotBlank
    private String content;

    private Boolean isRead;
    private LocalDateTime timestamp;
    private Long propertyId;
    private String propertyTitle;
}