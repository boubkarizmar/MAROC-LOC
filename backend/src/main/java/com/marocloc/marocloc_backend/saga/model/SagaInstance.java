package com.marocloc.marocloc_backend.saga.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "saga_instances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SagaInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "saga_type", nullable = false, length = 64)
    private SagaType sagaType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SagaStatus status;

    @Column(name = "correlation_id", length = 255)
    private String correlationId;

    @Column(length = 32)
    private String provider;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "result", length = 32)
    private String result;

    @Column(name = "result_message", columnDefinition = "TEXT")
    private String resultMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "sagaInstance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    private List<SagaStep> steps = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addStep(SagaStep step) {
        steps.add(step);
        step.setSagaInstance(this);
    }
}
