package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.ReviewStatus;
import com.marocloc.marocloc_backend.model.UserProfileReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileReviewRepository extends JpaRepository<UserProfileReview, Long> {

    Page<UserProfileReview> findByTargetUserIdAndStatus(Long targetUserId, ReviewStatus status, Pageable pageable);

    Page<UserProfileReview> findByAuthorIdAndStatus(Long authorId, ReviewStatus status, Pageable pageable);

    Optional<UserProfileReview> findByAuthorIdAndTargetUserId(Long authorId, Long targetUserId);

    boolean existsByAuthorIdAndTargetUserId(Long authorId, Long targetUserId);

    @Query("SELECT AVG(r.rating) FROM UserProfileReview r WHERE r.targetUser.id = :userId AND r.status = 'APPROVED'")
    Double getAverageRatingByTargetUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM UserProfileReview r WHERE r.targetUser.id = :userId AND r.status = 'APPROVED'")
    Long countByTargetUserId(@Param("userId") Long userId);
}
