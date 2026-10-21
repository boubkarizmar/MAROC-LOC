package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.AdvertisementPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdvertisementPaymentRepository extends JpaRepository<AdvertisementPayment, Long> {

    List<AdvertisementPayment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AdvertisementPayment> findByAdvertisementIdOrderByCreatedAtDesc(Long advertisementId);

    Optional<AdvertisementPayment> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);

    Optional<AdvertisementPayment> findByStripePaymentIntentId(String stripePaymentIntentId);

    Optional<AdvertisementPayment> findBySagaCorrelationId(String sagaCorrelationId);

    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM AdvertisementPayment p")
    Double sumTotalRevenue();

    @Query("SELECT COUNT(p) FROM AdvertisementPayment p")
    Long countTotalPayments();

    List<AdvertisementPayment> findAllByOrderByCreatedAtDesc();
}
