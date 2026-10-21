package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AnimatedStatsDTO;
import com.marocloc.marocloc_backend.dto.PlatformStatsDTO;
import com.marocloc.marocloc_backend.model.PropertyVisit;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.repository.AdvertisementRepository;
import com.marocloc.marocloc_backend.repository.OwnerRatingRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.PropertyVisitRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlatformStatsService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final OwnerRatingRepository ownerRatingRepository;
    private final AdvertisementRepository advertisementRepository;
    private final PropertyVisitRepository propertyVisitRepository;

    @Cacheable(value = "platformStats")
    public PlatformStatsDTO getPlatformStats() {
        Long verifiedProperties = propertyRepository.countByIsVerifiedTrue();
        Long activeUsers = userRepository.countByRoleNot(Role.ADMIN);

        Double avgResponseHours = ownerRatingRepository.getAverageResponseHours();
        Integer averageResponseTimeMinutes = avgResponseHours != null ? (int) (avgResponseHours * 60) : 60;

        Double avgRating = reviewRepository.getAverageRatingOfApprovedReviews();
        Double satisfactionRate = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 4.5;

        return PlatformStatsDTO.builder()
                .verifiedProperties(verifiedProperties != null ? verifiedProperties : 0L)
                .activeUsers(activeUsers != null ? activeUsers : 0L)
                .averageResponseTimeMinutes(averageResponseTimeMinutes)
                .satisfactionRate(satisfactionRate)
                .build();
    }

    @Cacheable(value = "animatedStats")
    public AnimatedStatsDTO getAnimatedStats() {
        long totalUsers = userRepository.count();
        long totalOwners = userRepository.countByRole(Role.PROPRIETAIRE);
        long totalProperties = propertyRepository.count();
        long totalAds = advertisementRepository.count();
        long totalRentals = propertyVisitRepository.countByStatus(PropertyVisit.VisitStatus.COMPLETED);
        long totalCities = propertyRepository.countDistinctCities();

        return AnimatedStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalOwners(totalOwners)
                .totalProperties(totalProperties)
                .totalAds(totalAds)
                .totalRentals(totalRentals)
                .totalCities(totalCities)
                .build();
    }
}
