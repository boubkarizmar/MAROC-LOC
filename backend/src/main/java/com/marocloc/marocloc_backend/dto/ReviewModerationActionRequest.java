package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewModerationActionRequest {

    @NotNull(message = "Review ID is required")
    private Long reviewId;

    private String action;
    private String reason;
}
