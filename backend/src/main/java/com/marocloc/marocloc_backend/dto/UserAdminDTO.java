package com.marocloc.marocloc_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Admin-safe User DTO
 * Excludes sensitive fields: password, cinImageUrl, CIN number
 * Used exclusively in AdminController to prevent PII leakage
 */
@Data
@Builder
public class UserAdminDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phoneNumber;
    private String city;
    private Boolean isVerified;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private Boolean isBanned;
    private LocalDateTime bannedAt;
    private String banReason;
}
