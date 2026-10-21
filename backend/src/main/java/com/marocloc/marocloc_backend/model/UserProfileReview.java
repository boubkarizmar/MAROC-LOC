package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User-to-user profile reviews (not property reviews)
 * Used for reputation/trust system
 */
@Entity
@Table(name = "user_profile_reviews", indexes = {
    @Index(name = "idx_upr_target", columnList = "target_user_id"),
    @Index(name = "idx_upr_author", columnList = "author_user_id"),
    @Index(name = "idx_upr_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** User being reviewed */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    /** User who wrote the review */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 2000)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.APPROVED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ReviewStatus.APPROVED;
    }
}
