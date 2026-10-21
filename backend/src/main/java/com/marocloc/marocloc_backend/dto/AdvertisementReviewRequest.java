package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvertisementReviewRequest {

    @NotNull(message = "Advertisement id is required")
    private Long advertisementId;

    @NotBlank(message = "Review comment is required")
    private String comment;
}
