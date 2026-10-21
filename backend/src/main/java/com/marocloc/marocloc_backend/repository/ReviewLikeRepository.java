package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    Optional<ReviewLike> findByUserIdAndReviewId(Long userId, Long reviewId);

    boolean existsByUserIdAndReviewId(Long userId, Long reviewId);

    @Query("SELECT COUNT(rl) FROM ReviewLike rl WHERE rl.review.id = :reviewId AND rl.isLike = true")
    Long countLikesByReviewId(@Param("reviewId") Long reviewId);

    @Query("SELECT COUNT(rl) FROM ReviewLike rl WHERE rl.review.id = :reviewId AND rl.isLike = false")
    Long countDislikesByReviewId(@Param("reviewId") Long reviewId);

    void deleteByUserIdAndReviewId(Long userId, Long reviewId);
}
