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
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String role;

    // Verification fields
    private String firstNameArabic;
    private String lastNameArabic;
    private String firstNameLatin;
    private String lastNameLatin;
    private String fullName;
    private String phoneNumber;
    private String city;
    private Boolean isVerified;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}
