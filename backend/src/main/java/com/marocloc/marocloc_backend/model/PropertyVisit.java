package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "property_visit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "property_id", insertable = false, updatable = false)
    private Long propertyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visitor_id", nullable = false)
    private User visitor;

    @Column(name = "visitor_id", insertable = false, updatable = false)
    private Long visitorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "owner_id", insertable = false, updatable = false)
    private Long ownerId;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false)
    private LocalTime visitTime;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VisitStatus status = VisitStatus.PENDING;

    @Column(length = 500)
    private String notes;

    @Column(length = 20)
    private String visitorPhone;

    @Column(length = 255)
    private String visitorEmail;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum VisitStatus {
        PENDING,
        CONFIRMED,
        COMPLETED,
        CANCELLED,
        NO_SHOW
    }
}
