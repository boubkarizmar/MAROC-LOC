package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Review entity with multi-dimensional ratings
 * Supports property ratings, owner ratings, and moderation
 */
@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_property", columnList = "property_id"),
    @Index(name = "idx_review_user", columnList = "user_id"),
    @Index(name = "idx_review_status", columnList = "status"),
    @Index(name = "idx_review_created", columnList = "created_at DESC")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Overall rating (1-5) */
    @Column(nullable = false)
    private Integer rating;

    /** Multi-dimensional ratings (1-5 each) */
    @Column(name = "location_rating")
    private Integer locationRating;

    @Column(name = "price_rating")
    private Integer priceRating;

    @Column(name = "cleanliness_rating")
    private Integer cleanlinessRating;

    @Column(name = "communication_rating")
    private Integer communicationRating;

    @Column(name = "neighborhood_rating")
    private Integer neighborhoodRating;

    @Column(name = "security_rating")
    private Integer securityRating;

    @Column(length = 2000)
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.APPROVED;

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 0;

    @Column(name = "helpful_count")
    @Builder.Default
    private Integer helpfulCount = 0;

    /** Sentiment analysis results */
    @Column(name = "sentiment_score")
    private Double sentimentScore;

    @Column(name = "sentiment_label", length = 20)
    private String sentimentLabel;

    @Column(name = "sentiment_confidence")
    private Double sentimentConfidence;

    @Column(name = "sentiment_analyzed_at")
    private LocalDateTime sentimentAnalyzedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = ReviewStatus.APPROVED;
        if (isVerified == null) isVerified = false;
        if (reportCount == null) reportCount = 0;
        if (helpfulCount == null) helpfulCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
