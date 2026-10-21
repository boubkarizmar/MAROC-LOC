package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.PaymentTransaction;
import com.marocloc.marocloc_backend.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findFirstByProviderTransactionIdOrderByCreatedAtDesc(String providerTransactionId);

    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PaymentTransaction> findByStatusAndCreatedAtAfter(PaymentStatus status, LocalDateTime createdAt);

    long countByStatus(PaymentStatus status);

    Optional<PaymentTransaction> findFirstByPropertyReservationIdOrderByCreatedAtDesc(Long propertyReservationId);
}
