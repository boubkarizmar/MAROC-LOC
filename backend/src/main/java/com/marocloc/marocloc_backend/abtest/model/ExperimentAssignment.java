package com.marocloc.marocloc_backend.abtest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ab_experiment_assignment", indexes = {
    @Index(name = "idx_ab_user_exp", columnList = "userId,experimentKey", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "experiment_key", nullable = false, length = 64)
    private String experimentKey;

    @Column(name = "variant", nullable = false, length = 32)
    private String variant;

    @Column(name = "assigned_at")
    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}
