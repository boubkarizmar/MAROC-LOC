package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Aggregated owner rating metrics
 * Recalculated periodically based on reviews and activity
 */
@Entity
@Table(name = "owner_ratings", indexes = {
    @Index(name = "idx_owner_rating_user", columnList = "user_id", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Overall owner score (0-100) */
    @Column(name = "overall_score")
    @Builder.Default
    private Double overallScore = 0.0;

    /** Response speed score (0-100) */
    @Column(name = "response_speed_score")
    @Builder.Default
    private Double responseSpeedScore = 0.0;

    /** Trust score (0-100) */
    @Column(name = "trust_score")
    @Builder.Default
    private Double trustScore = 0.0;

    /** Professionalism score (0-100) */
    @Column(name = "professionalism_score")
    @Builder.Default
    private Double professionalismScore = 0.0;

    /** Property quality score (0-100) */
    @Column(name = "property_quality_score")
    @Builder.Default
    private Double propertyQualityScore = 0.0;

    /** Total number of reviews received */
    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    /** Number of properties listed */
    @Column(name = "total_properties")
    @Builder.Default
    private Integer totalProperties = 0;

    /** Response rate percentage */
    @Column(name = "response_rate")
    @Builder.Default
    private Double responseRate = 0.0;

    /** Average response time in hours */
    @Column(name = "avg_response_hours")
    @Builder.Default
    private Double avgResponseHours = 0.0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (overallScore == null) overallScore = 0.0;
        if (responseSpeedScore == null) responseSpeedScore = 0.0;
        if (trustScore == null) trustScore = 0.0;
        if (professionalismScore == null) professionalismScore = 0.0;
        if (propertyQualityScore == null) propertyQualityScore = 0.0;
        if (totalReviews == null) totalReviews = 0;
        if (totalProperties == null) totalProperties = 0;
        if (responseRate == null) responseRate = 0.0;
        if (avgResponseHours == null) avgResponseHours = 0.0;
    }
}
