package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.SiteReview;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteReviewRepository extends JpaRepository<SiteReview, Long> {
    List<SiteReview> findByStatusOrderByCreatedAtDesc(ReviewStatus status);
    long countByStatus(ReviewStatus status);

    @Query("SELECT COALESCE(AVG(sr.rating), 0.0) FROM SiteReview sr WHERE sr.status = 'APPROVED'")
    Double getAverageRating();
}
