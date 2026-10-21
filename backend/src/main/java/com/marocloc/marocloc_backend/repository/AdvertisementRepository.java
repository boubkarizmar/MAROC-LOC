package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Advertisement;
import com.marocloc.marocloc_backend.model.AdvertisementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AdvertisementRepository extends JpaRepository<Advertisement, Long> {

    List<Advertisement> findByIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByPriorityDesc(
            LocalDate startDate,
            LocalDate endDate
    );

    List<Advertisement> findByCreatedByUserIdOrderByCreatedAtDesc(Long createdByUserId);

    List<Advertisement> findByStatusOrderByPriorityDesc(AdvertisementStatus status);

    List<Advertisement> findByIsActiveTrueAndStatusAndEndDateBetweenOrderByEndDateAsc(
            AdvertisementStatus status,
            LocalDate startDate,
            LocalDate endDate
    );
}
