package com.marocloc.marocloc_backend.model;

import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "property_ratings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"review_id", "dimension"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RatingDimension dimension;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
