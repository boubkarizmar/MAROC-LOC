package com.marocloc.marocloc_backend.saga.repository;

import com.marocloc.marocloc_backend.saga.model.SagaInstance;
import com.marocloc.marocloc_backend.saga.model.SagaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SagaInstanceRepository extends JpaRepository<SagaInstance, Long> {

    Optional<SagaInstance> findByCorrelationId(String correlationId);

    Page<SagaInstance> findByStatus(SagaStatus status, Pageable pageable);
}
