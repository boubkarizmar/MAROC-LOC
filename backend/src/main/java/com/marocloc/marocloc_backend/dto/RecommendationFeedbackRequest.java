package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for recording recommendation feedback.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationFeedbackRequest {

    @NotNull
    private Long propertyId;

    @NotNull
    private String feedbackType; // CLICK, SAVE, DISMISS, CONTACT
}
