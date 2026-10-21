package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Nested comment system for reviews
 * Supports replies, likes/dislikes, pinning, and moderation
 */
@Entity
@Table(name = "comments", indexes = {
    @Index(name = "idx_comment_review", columnList = "review_id"),
    @Index(name = "idx_comment_parent", columnList = "parent_id"),
    @Index(name = "idx_comment_user", columnList = "user_id"),
    @Index(name = "idx_comment_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 3000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Parent comment for nested replies (null = top-level) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(name = "like_count")
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "dislike_count")
    @Builder.Default
    private Integer dislikeCount = 0;

    @Column(name = "is_pinned")
    @Builder.Default
    private Boolean isPinned = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CommentStatus status = CommentStatus.APPROVED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (likeCount == null) likeCount = 0;
        if (dislikeCount == null) dislikeCount = 0;
        if (isPinned == null) isPinned = false;
        if (status == null) status = CommentStatus.APPROVED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
