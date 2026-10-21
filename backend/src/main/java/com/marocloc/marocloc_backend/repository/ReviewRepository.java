package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Review;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<Review> findByPropertyIdAndStatus(Long propertyId, ReviewStatus status);

    @EntityGraph(attributePaths = {"property"})
    List<Review> findByUserIdAndStatus(Long userId, ReviewStatus status);

    Optional<Review> findByUserIdAndPropertyId(Long userId, Long propertyId);

    @Query(value = "SELECT AVG(rating) FROM reviews WHERE property_id = ?1 AND status = 'APPROVED'", nativeQuery = true)
    Double getAverageRatingByPropertyId(Long propertyId);

    @Query(value = "SELECT COUNT(*) FROM reviews WHERE property_id = ?1 AND status = 'APPROVED'", nativeQuery = true)
    Long countByPropertyIdAndStatusApproved(Long propertyId);

    @Query(value = "SELECT AVG(r.rating) FROM reviews r JOIN property p ON r.property_id = p.id WHERE p.owner_id = ?1 AND r.status = 'APPROVED'", nativeQuery = true)
    Double getAverageRatingByOwnerId(Long ownerId);

    @Query(value = "SELECT COUNT(*) FROM reviews r JOIN property p ON r.property_id = p.id WHERE p.owner_id = ?1 AND r.status = 'APPROVED'", nativeQuery = true)
    Long countByOwnerIdAndStatusApproved(Long ownerId);

    @EntityGraph(attributePaths = {"user"})
    List<Review> findByPropertyIdInAndStatus(List<Long> propertyIds, ReviewStatus status);

    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE Review r SET r.helpfulCount = r.helpfulCount + 1 WHERE r.id = :reviewId")
    void incrementHelpfulCount(@Param("reviewId") Long reviewId);

    @Modifying
    @Query("UPDATE Review r SET r.reportCount = r.reportCount + 1 WHERE r.id = :reviewId")
    void incrementReportCount(@Param("reviewId") Long reviewId);

    @Query("SELECT r FROM Review r WHERE r.status = :status ORDER BY r.createdAt DESC")
    Page<Review> findPendingReviews(@Param("status") ReviewStatus status, Pageable pageable);

    @Query(value = "SELECT AVG(rating) FROM reviews WHERE status = 'APPROVED'", nativeQuery = true)
    Double getAverageRatingOfApprovedReviews();

    @Query(value = "SELECT property_id, AVG(rating), COUNT(*) FROM reviews WHERE status = 'APPROVED' GROUP BY property_id", nativeQuery = true)
    List<Object[]> getReviewStatsByProperty();

    @Query(value = "SELECT property_id, AVG(rating), COUNT(*) FROM reviews WHERE status = 'APPROVED' AND property_id IN :propertyIds GROUP BY property_id", nativeQuery = true)
    List<Object[]> getReviewStatsByPropertyIds(@Param("propertyIds") List<Long> propertyIds);

    @Query(value = "SELECT property_id, AVG(rating) FROM reviews WHERE status = 'APPROVED' AND property_id IN :propertyIds GROUP BY property_id", nativeQuery = true)
    List<Object[]> getAverageRatingsByPropertyIds(@Param("propertyIds") List<Long> propertyIds);

    @EntityGraph(attributePaths = {"user", "property"})
    @Query("SELECT r FROM Review r WHERE r.status = :status ORDER BY r.helpfulCount DESC, r.createdAt DESC")
    List<Review> findVerifiedReviews(@Param("status") ReviewStatus status, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.status = 'APPROVED' GROUP BY r.rating ORDER BY r.rating")
    List<Object[]> getApprovedRatingDistribution();

    long countByStatus(ReviewStatus status);
}