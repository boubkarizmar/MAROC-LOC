package com.marocloc.marocloc_backend.abtest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ab_experiment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Experiment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "experiment_key", nullable = false, unique = true, length = 64)
    private String experimentKey;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "variant_a", nullable = false, length = 32)
    @Builder.Default
    private String variantA = "control";

    @Column(name = "variant_b", nullable = false, length = 32)
    @Builder.Default
    private String variantB = "treatment";

    @Column(name = "split_ratio")
    @Builder.Default
    private Double splitRatio = 0.5;

    @Column(name = "target_metric", nullable = false)
    private String targetMetric; // e.g., "click_through_rate", "conversion_rate"

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "RUNNING"; // RUNNING, PAUSED, COMPLETED

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "minimum_sample_size")
    private Integer minimumSampleSize;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
