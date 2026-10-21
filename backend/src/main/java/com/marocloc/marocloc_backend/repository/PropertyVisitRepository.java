package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.PropertyVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PropertyVisitRepository extends JpaRepository<PropertyVisit, Long> {

    List<PropertyVisit> findByVisitorIdOrderByVisitDateDesc(Long visitorId);

    List<PropertyVisit> findByOwnerIdOrderByVisitDateDesc(Long ownerId);

    List<PropertyVisit> findByPropertyIdOrderByVisitDateDesc(Long propertyId);

    @Query("SELECT v FROM PropertyVisit v WHERE v.propertyId = :propertyId AND v.visitDate = :date AND v.status NOT IN ('CANCELLED', 'NO_SHOW')")
    List<PropertyVisit> findActiveVisitsByPropertyAndDate(@Param("propertyId") Long propertyId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(v) FROM PropertyVisit v WHERE v.propertyId = :propertyId AND v.visitDate = :date AND v.visitTime = :time AND v.status NOT IN ('CANCELLED', 'NO_SHOW')")
    Long countActiveVisitsAtTime(@Param("propertyId") Long propertyId, @Param("date") LocalDate date, @Param("time") java.time.LocalTime time);

    @Query("SELECT v FROM PropertyVisit v WHERE v.visitorId = :userId OR v.ownerId = :userId ORDER BY v.visitDate DESC, v.visitTime DESC")
    List<PropertyVisit> findAllByUserId(@Param("userId") Long userId);

    long countByStatus(PropertyVisit.VisitStatus status);

    @Query("""
        SELECT v FROM PropertyVisit v
        WHERE v.status NOT IN ('CANCELLED', 'NO_SHOW', 'COMPLETED')
          AND v.visitDate = :date
          AND v.visitTime BETWEEN :startTime AND :endTime
        """)
    List<PropertyVisit> findUpcomingVisitsInWindow(
            @Param("date") LocalDate date,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime);
}
