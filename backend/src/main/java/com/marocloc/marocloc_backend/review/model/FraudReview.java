package com.marocloc.marocloc_backend.review.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_review")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fraud_score_id", nullable = false)
    private Long fraudScoreId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "reviewed_by", nullable = false)
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    @Builder.Default
    private LocalDateTime reviewedAt = LocalDateTime.now();

    @Column(name = "final_decision", nullable = false, length = 20)
    private String finalDecision; // APPROVED, REJECTED, ESCALATED

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "explanation_confidence")
    private Double explanationConfidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_importance", columnDefinition = "jsonb")
    private String featureImportance;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rules_reviewed", columnDefinition = "jsonb")
    private String rulesReviewed;

    @Column(name = "review_time_seconds")
    private Integer reviewTimeSeconds;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, COMPLETED, ESCALATED
}
