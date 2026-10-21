package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.OwnerRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OwnerRatingRepository extends JpaRepository<OwnerRating, Long> {

    Optional<OwnerRating> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT AVG(o.avgResponseHours) FROM OwnerRating o WHERE o.avgResponseHours IS NOT NULL")
    Double getAverageResponseHours();

    @Query("SELECT o.user.id, o.overallScore FROM OwnerRating o")
    List<Object[]> findAllOwnerScores();
}
