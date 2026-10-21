package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ViewedProperty entity for tracking user's property viewing history
 * Helps provide "Recently Viewed" feature
 */
@Entity
@Table(name = "viewed_properties", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_property_id", columnList = "property_id"),
    @Index(name = "idx_viewed_at", columnList = "viewed_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewedProperty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "viewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime viewedAt = LocalDateTime.now();

    @Column(name = "view_duration_seconds")
    private Integer viewDurationSeconds;
}
