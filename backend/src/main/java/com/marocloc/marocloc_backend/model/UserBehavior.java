package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * UserBehavior entity for tracking comprehensive user interactions
 * Used for ML-based recommendations and personalization
 */
@Entity
@Table(name = "user_behaviors", indexes = {
    @Index(name = "idx_user_behavior", columnList = "user_id, behavior_type, created_at"),
    @Index(name = "idx_behavior_type", columnList = "behavior_type"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBehavior {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "behavior_type", nullable = false)
    private String behaviorType; // VIEW, SEARCH, FAVORITE, CONTACT, BOOKMARK, etc.

    @Column(name = "entity_type")
    private String entityType; // PROPERTY, USER, SEARCH_QUERY, etc.

    @Column(name = "entity_id")
    private Long entityId; // ID of the entity (property_id, etc.)

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string with additional data (search params, duration, etc.)

    @Column(name = "weight")
    @Builder.Default
    private Double weight = 1.0; // Importance weight for ML algorithms

    @Column(name = "session_id")
    private String sessionId; // For session-based analysis

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;
}