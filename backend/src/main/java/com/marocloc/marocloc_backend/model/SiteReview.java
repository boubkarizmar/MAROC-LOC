package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "site_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Min(1)
    @Max(5)
    private Integer rating;

    @Column(length = 2000)
    private String comment;

    private String userName;
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.APPROVED;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
