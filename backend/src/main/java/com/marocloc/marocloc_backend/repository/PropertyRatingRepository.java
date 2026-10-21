package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.PropertyRating;
import com.marocloc.marocloc_backend.model.enums.RatingDimension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyRatingRepository extends JpaRepository<PropertyRating, Long> {

    List<PropertyRating> findByReviewId(Long reviewId);

    Optional<PropertyRating> findByReviewIdAndDimension(Long reviewId, RatingDimension dimension);

    @Query("SELECT pr.dimension, AVG(pr.score) FROM PropertyRating pr " +
           "JOIN pr.review r WHERE r.property.id = :propertyId AND r.status = 'APPROVED' " +
           "GROUP BY pr.dimension")
    List<Object[]> getAverageByDimensionForProperty(@Param("propertyId") Long propertyId);

    @Query("SELECT COUNT(pr) FROM PropertyRating pr JOIN pr.review r " +
           "WHERE r.property.id = :propertyId AND pr.dimension = :dimension AND pr.score = :score")
    Long countByPropertyAndDimensionAndScore(@Param("propertyId") Long propertyId,
                                              @Param("dimension") RatingDimension dimension,
                                              @Param("score") Integer score);
}
