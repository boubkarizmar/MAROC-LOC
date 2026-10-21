package com.marocloc.marocloc_backend.analytics.service;

import com.marocloc.marocloc_backend.analytics.dto.OwnerDashboardDTO;
import com.marocloc.marocloc_backend.event.repository.EventLogRepository;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OwnerDashboardService {

    private final PropertyRepository propertyRepository;
    private final ReviewRepository reviewRepository;
    private final MessageRepository messageRepository;
    private final FavoriteRepository favoriteRepository;
    private final AdvertisementRepository advertisementRepository;
    private final AdvertisementPaymentRepository advertisementPaymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public OwnerDashboardDTO getDashboard(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found: " + ownerId));

        Page<Property> propertyPage = propertyRepository.findByOwnerId(ownerId, Pageable.unpaged());
        List<Property> properties = propertyPage.getContent();

        List<Property> activeProps = properties.stream()
                .filter(p -> p.getStatus() == PropertyStatus.APPROVED || p.getStatus() == PropertyStatus.AVAILABLE)
                .collect(Collectors.toList());

        long totalViews = properties.stream()
                .mapToLong(p -> p.getViewCount() != null ? p.getViewCount() : 0)
                .sum();

        List<Long> propertyIds = properties.stream().map(Property::getId).collect(Collectors.toList());
        // Collect all reviews for owner's properties (batch fetch)
        List<Review> allReviews = propertyIds.isEmpty()
                ? List.of()
                : reviewRepository.findByPropertyIdInAndStatus(propertyIds, ReviewStatus.APPROVED);

        Double avgRating = allReviews.isEmpty() ? 0.0 :
                allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);

        List<Advertisement> ads = advertisementRepository.findByCreatedByUserIdOrderByCreatedAtDesc(ownerId);
        List<AdvertisementPayment> payments = advertisementPaymentRepository.findByUserIdOrderByCreatedAtDesc(ownerId);

        BigDecimal totalAdSpend = payments.stream()
                .map(p -> p.getAmount() != null ? BigDecimal.valueOf(p.getAmount()) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        // Top properties by views
        List<Map<String, Object>> topProperties = properties.stream()
                .sorted(Comparator.comparing(Property::getViewCount, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId());
                    map.put("title", p.getTitle());
                    map.put("views", p.getViewCount());
                    map.put("city", p.getCity());
                    map.put("price", p.getPrice());
                    return map;
                })
                .collect(Collectors.toList());

        return OwnerDashboardDTO.builder()
                .ownerId(ownerId)
                .ownerName(owner.getName())
                .totalProperties(properties.size())
                .activeProperties(activeProps.size())
                .pendingProperties((int) properties.stream().filter(p -> p.getStatus() == PropertyStatus.PENDING).count())
                .totalPropertyViews(totalViews)
                .totalFavorites(propertyIds.isEmpty() ? 0L : favoriteRepository.countByPropertyIdIn(propertyIds))
                .totalInquiries(messageRepository.countByReceiverId(ownerId))
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .totalReviews(allReviews.size())
                .newReviewsThisMonth((int) allReviews.stream()
                        .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(1)))
                        .count())
                .totalAdSpend(totalAdSpend)
                .adRevenueThisMonth(BigDecimal.ZERO)
                .activeAds((int) ads.stream().filter(a -> Boolean.TRUE.equals(a.getIsActive())).count())
                .totalAds(ads.size())
                .topProperties(topProperties)
                .propertyViewsTrend(Collections.emptyList())
                .inquiryTrend(Collections.emptyList())
                .build();
    }
}
