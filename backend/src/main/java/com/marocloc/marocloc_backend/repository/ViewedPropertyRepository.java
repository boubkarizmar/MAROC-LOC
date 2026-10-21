package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.ViewedProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for ViewedProperty entity
 * Tracks property viewing history for recommendations
 */
@Repository
public interface ViewedPropertyRepository extends JpaRepository<ViewedProperty, Long> {

    List<ViewedProperty> findByUserId(Long userId);

    List<ViewedProperty> findByPropertyId(Long propertyId);

    @Query("SELECT vp FROM ViewedProperty vp WHERE vp.viewedAt > :since ORDER BY vp.viewedAt DESC")
    List<ViewedProperty> findByViewedAtAfter(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(vp) FROM ViewedProperty vp WHERE vp.property.id = :propertyId")
    Long countViewsByPropertyId(@Param("propertyId") Long propertyId);
}
