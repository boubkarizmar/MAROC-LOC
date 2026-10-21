package com.marocloc.marocloc_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SiteReviewDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private String userName;
    private LocalDateTime createdAt;
}
