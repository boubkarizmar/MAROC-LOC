package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.PropertyReservation;
import com.marocloc.marocloc_backend.model.PropertyReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyReservationRepository extends JpaRepository<PropertyReservation, Long> {

    @Query("SELECT r FROM PropertyReservation r JOIN FETCH r.property JOIN FETCH r.buyer JOIN FETCH r.seller WHERE r.buyer.id = :buyerId ORDER BY r.createdAt DESC")
    List<PropertyReservation> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") Long buyerId);

    @Query("SELECT r FROM PropertyReservation r JOIN FETCH r.property JOIN FETCH r.buyer JOIN FETCH r.seller WHERE r.property.id = :propertyId ORDER BY r.createdAt DESC")
    List<PropertyReservation> findByPropertyIdOrderByCreatedAtDesc(@Param("propertyId") Long propertyId);

    Optional<PropertyReservation> findFirstBySagaCorrelationIdOrderByCreatedAtDesc(String sagaCorrelationId);

    List<PropertyReservation> findByStatusAndExpiresAtBefore(PropertyReservationStatus status, java.time.LocalDateTime now);
}
