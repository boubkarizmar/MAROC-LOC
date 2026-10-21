package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Integer rating;
    private String comment;
    private Long userId;
    private String userName;
    private Long propertyId;
    private Boolean isVerified;
    private String status;
    private Integer helpfulCount;
    private Integer reportCount;
    private Long likeCount;
    private Long dislikeCount;
    private Map<RatingDimension, Integer> ratings;
    private List<CommentDTO> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Sentiment analysis
    private Double sentimentScore;
    private String sentimentLabel;
    private Double sentimentConfidence;
    private LocalDateTime sentimentAnalyzedAt;
}
