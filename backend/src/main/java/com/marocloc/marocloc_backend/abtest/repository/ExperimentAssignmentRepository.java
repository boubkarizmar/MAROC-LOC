package com.marocloc.marocloc_backend.abtest.repository;

import com.marocloc.marocloc_backend.abtest.model.ExperimentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExperimentAssignmentRepository extends JpaRepository<ExperimentAssignment, Long> {

    Optional<ExperimentAssignment> findByUserIdAndExperimentKey(Long userId, String experimentKey);
}
