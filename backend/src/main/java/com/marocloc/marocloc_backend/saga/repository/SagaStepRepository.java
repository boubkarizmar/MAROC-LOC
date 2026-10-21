package com.marocloc.marocloc_backend.saga.repository;

import com.marocloc.marocloc_backend.saga.model.SagaStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SagaStepRepository extends JpaRepository<SagaStep, Long> {

    List<SagaStep> findBySagaInstanceIdOrderByStepOrderAsc(Long sagaInstanceId);
}
