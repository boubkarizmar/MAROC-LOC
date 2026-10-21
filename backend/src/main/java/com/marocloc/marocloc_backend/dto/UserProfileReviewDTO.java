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
public class UserProfileReviewDTO {

    private Long id;
    private Integer rating;
    private String comment;
    private Long targetUserId;
    private String targetUserName;
    private Long authorId;
    private String authorName;
    private String status;
    private LocalDateTime createdAt;
}
