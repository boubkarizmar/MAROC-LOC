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
public class ReviewModerationRequest {

    @NotNull
    private Long reviewId;

    @NotNull
    private String action; // APPROVE, REJECT, FLAG, UNFLAG

    private String reason;
}
