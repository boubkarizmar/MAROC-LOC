package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyReservation;
import com.marocloc.marocloc_backend.model.PropertyReservationStatus;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.PropertyReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationExpiryScheduler {

    private final PropertyReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;

    @Transactional
    @Scheduled(fixedRate = 60_000)
    public void expirePendingReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<PropertyReservation> expired = reservationRepository.findByStatusAndExpiresAtBefore(
                PropertyReservationStatus.PENDING, now);

        if (expired.isEmpty()) {
            return;
        }

        log.info("Expiring {} pending reservation(s)", expired.size());
        for (PropertyReservation reservation : expired) {
            reservation.setStatus(PropertyReservationStatus.EXPIRED);
            reservation.setUpdatedAt(now);
            Property property = reservation.getProperty();
            if (property != null && property.getStatus() == PropertyStatus.PENDING_PAYMENT) {
                property.setStatus(PropertyStatus.AVAILABLE);
                propertyRepository.save(property);
            }
        }
        reservationRepository.saveAll(expired);
    }
}
