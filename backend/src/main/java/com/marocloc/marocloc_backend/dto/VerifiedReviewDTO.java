package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifiedReviewDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private String userName;
    private String userAvatar;
    private String city;
    private LocalDateTime createdAt;
}
