package com.marocloc.marocloc_backend.abtest.repository;

import com.marocloc.marocloc_backend.abtest.model.Experiment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperimentRepository extends JpaRepository<Experiment, Long> {

    Optional<Experiment> findByExperimentKeyAndStatus(String experimentKey, String status);

    List<Experiment> findByStatus(String status);
}
