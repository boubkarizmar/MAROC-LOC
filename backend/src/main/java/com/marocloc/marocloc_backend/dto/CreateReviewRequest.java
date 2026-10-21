package com.marocloc.marocloc_backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {

    @NotNull(message = "Overall rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Min(value = 1, message = "Location rating must be at least 1")
    @Max(value = 5, message = "Location rating must be at most 5")
    private Integer locationRating;

    @Min(value = 1, message = "Price rating must be at least 1")
    @Max(value = 5, message = "Price rating must be at most 5")
    private Integer priceRating;

    @Min(value = 1, message = "Cleanliness rating must be at least 1")
    @Max(value = 5, message = "Cleanliness rating must be at most 5")
    private Integer cleanlinessRating;

    @Min(value = 1, message = "Communication rating must be at least 1")
    @Max(value = 5, message = "Communication rating must be at most 5")
    private Integer communicationRating;

    @Min(value = 1, message = "Neighborhood rating must be at least 1")
    @Max(value = 5, message = "Neighborhood rating must be at most 5")
    private Integer neighborhoodRating;

    @Min(value = 1, message = "Security rating must be at least 1")
    @Max(value = 5, message = "Security rating must be at most 5")
    private Integer securityRating;

    @Size(max = 2000, message = "Comment must be at most 2000 characters")
    private String comment;
}
