package com.marocloc.marocloc_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed review DTO with multi-dimensional ratings and comments
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDetailDTO {

    private Long id;
    private Integer rating;
    private Integer locationRating;
    private Integer priceRating;
    private Integer cleanlinessRating;
    private Integer communicationRating;
    private Integer neighborhoodRating;
    private Integer securityRating;
    private String comment;
    private Long userId;
    private String userName;
    private Long propertyId;
    private String propertyTitle;
    private Boolean isVerified;
    private String status;
    private Integer helpfulCount;
    private Integer reportCount;
    private LocalDateTime createdAt;
    private List<CommentDTO> topComments;
}
