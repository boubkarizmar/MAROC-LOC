package com.marocloc.marocloc_backend.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewWithRatingsRequest {

    @Valid
    private ReviewDTO review;

    @Valid
    private RatingRequest ratings;
}
