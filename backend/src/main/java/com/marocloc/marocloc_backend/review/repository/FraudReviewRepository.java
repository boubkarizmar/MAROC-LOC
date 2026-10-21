package com.marocloc.marocloc_backend.review.repository;

import com.marocloc.marocloc_backend.review.model.FraudReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FraudReviewRepository extends JpaRepository<FraudReview, Long> {

    Optional<FraudReview> findByFraudScoreId(Long fraudScoreId);

    Page<FraudReview> findByStatusOrderByReviewedAtDesc(String status, Pageable pageable);

    @Query("SELECT fr FROM FraudReview fr WHERE fr.status = 'PENDING' ORDER BY fr.reviewedAt DESC")
    List<FraudReview> findPendingReviews(Pageable pageable);

    @Query(value = """
        SELECT
            final_decision,
            COUNT(*) as count,
            AVG(review_time_seconds) as avg_time
        FROM fraud_review
        WHERE reviewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY final_decision
        """, nativeQuery = true)
    List<Object[]> getReviewStats();
}
