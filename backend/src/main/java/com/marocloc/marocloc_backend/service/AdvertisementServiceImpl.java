package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AdvertisementAnalyticsDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementMetricsRequest;
import com.marocloc.marocloc_backend.dto.AdvertisementRequest;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.Advertisement;
import com.marocloc.marocloc_backend.model.AdvertisementStatus;
import com.marocloc.marocloc_backend.model.PaymentStatus;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.repository.AdvertisementRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.AbstractMap;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdvertisementServiceImpl implements AdvertisementService {

    private final AdvertisementRepository advertisementRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<AdvertisementDTO> getActiveAds() {
        LocalDate today = LocalDate.now();
        return advertisementRepository
                .findByIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByPriorityDesc(today, today)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdvertisementDTO> getActiveAdsByStatus() {
        return advertisementRepository.findByStatusOrderByPriorityDesc(AdvertisementStatus.ACTIVE)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdvertisementDTO> getAllAds() {
        return advertisementRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdvertisementDTO> getRotatedAds(String slot, int limit) {
        LocalDate today = LocalDate.now();
        List<Advertisement> candidates = advertisementRepository
                .findByIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByPriorityDesc(today, today);

        return candidates.stream()
                .filter(ad -> ad.getBudget() != null && ad.getBudget().compareTo(BigDecimal.ZERO) > 0)
                .map(ad -> {
                    double priority = ad.getPriority() != null ? ad.getPriority() : 0.0;
                    double totalBudget = ad.getBudget().doubleValue();
                    double remainingBudget = totalBudget;
                    long impressions = ad.getImpressions() != null ? ad.getImpressions() : 0L;
                    long clicks = ad.getClicks() != null ? ad.getClicks() : 0L;
                    double ctr = impressions > 0 ? (double) clicks / impressions : 0.0;
                    double relevance = Math.min(1.0, priority / 10.0);

                    double score = (0.3 * priority)
                                 + (0.3 * remainingBudget / totalBudget)
                                 + (0.2 * ctr)
                                 + (0.2 * relevance);

                    return new AbstractMap.SimpleEntry<>(ad, score);
                })
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(e -> mapToDTO(e.getKey()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdvertisementDTO previewAd(AdvertisementRequest request) {
        Advertisement advertisement = Advertisement.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .type(request.getType())
                .propertyId(request.getPropertyId())
                .isActive(request.getIsActive() != null ? request.getIsActive() : false)
                .status(request.getStatus() != null ? request.getStatus() : AdvertisementStatus.PENDING_APPROVAL)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PENDING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .budget(request.getBudget())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .targetAudience(request.getTargetAudience())
                .paymentReference(request.getPaymentReference())
                .adminComment(request.getAdminComment())
                .build();

        return mapToDTO(advertisement);
    }

    @Override
    @Transactional
    public AdvertisementDTO createAd(AdvertisementRequest request) {
        loadLinkedProperty(request.getPropertyId());

        Advertisement advertisement = Advertisement.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .type(request.getType())
                .plan(request.getPlan())
                .propertyId(request.getPropertyId())
                .propertyIds(request.getPropertyIds() != null ? String.join(",", request.getPropertyIds().stream().map(String::valueOf).toList()) : null)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .status(request.getStatus() != null ? request.getStatus() : AdvertisementStatus.ACTIVE)
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .budget(request.getBudget())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .targetAudience(request.getTargetAudience())
                .paymentReference(request.getPaymentReference())
                .adminComment(request.getAdminComment())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Advertisement saved = advertisementRepository.save(advertisement);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public AdvertisementDTO updateAd(Long id, AdvertisementRequest request) {
        Advertisement advertisement = advertisementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Advertisement", id));

        loadLinkedProperty(request.getPropertyId());

        advertisement.setTitle(request.getTitle());
        advertisement.setDescription(request.getDescription());
        advertisement.setImageUrl(request.getImageUrl());
        advertisement.setVideoUrl(request.getVideoUrl());
        advertisement.setType(request.getType());
        advertisement.setPlan(request.getPlan());
        advertisement.setPropertyId(request.getPropertyId());
        advertisement.setPropertyIds(request.getPropertyIds() != null ? String.join(",", request.getPropertyIds().stream().map(String::valueOf).toList()) : advertisement.getPropertyIds());
        advertisement.setIsActive(request.getIsActive() != null ? request.getIsActive() : advertisement.getIsActive());
        advertisement.setStatus(request.getStatus() != null ? request.getStatus() : advertisement.getStatus());
        advertisement.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : advertisement.getPaymentStatus());
        advertisement.setStartDate(request.getStartDate());
        advertisement.setEndDate(request.getEndDate());
        advertisement.setPriority(request.getPriority() != null ? request.getPriority() : advertisement.getPriority());
        advertisement.setBudget(request.getBudget());
        advertisement.setCurrency(request.getCurrency());
        advertisement.setTargetAudience(request.getTargetAudience());
        advertisement.setPaymentReference(request.getPaymentReference());
        advertisement.setAdminComment(request.getAdminComment());
        advertisement.setUpdatedAt(LocalDateTime.now());

        Advertisement updated = advertisementRepository.save(advertisement);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteAd(Long id) {
        Advertisement advertisement = advertisementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Advertisement", id));
        advertisementRepository.delete(advertisement);
    }

    @Override
    @Transactional
    public AdvertisementDTO submitAdRequest(AdvertisementRequest request, String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("User", username));

        Property property = loadLinkedProperty(request.getPropertyId());

        Advertisement advertisement = Advertisement.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .type(request.getType())
                .plan(request.getPlan())
                .propertyId(property.getId())
                .propertyIds(request.getPropertyIds() != null ? String.join(",", request.getPropertyIds().stream().map(String::valueOf).toList()) : null)
                .isActive(false)
                .status(AdvertisementStatus.PENDING_APPROVAL)
                .paymentStatus(PaymentStatus.PENDING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .budget(request.getBudget())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .targetAudience(request.getTargetAudience())
                .paymentReference(request.getPaymentReference())
                .createdByUserId(user.getId())
                .createdByUserEmail(user.getEmail())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Advertisement saved = advertisementRepository.save(advertisement);
        notificationService.createFromTemplate(NotificationTemplate.advertisementCreated(user.getId(), saved.getId()));
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdvertisementDTO> getUserAds(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("User", username));

        return advertisementRepository.findByCreatedByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdvertisementDTO> getPendingRequests() {
        return advertisementRepository.findByStatusOrderByPriorityDesc(AdvertisementStatus.PENDING_APPROVAL)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdvertisementDTO approveAdRequest(Long id, String adminComment) {
        Advertisement advertisement = advertisementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Advertisement", id));

        advertisement.setStatus(AdvertisementStatus.APPROVED);
        advertisement.setIsActive(true);
        advertisement.setPaymentStatus(PaymentStatus.PAID);
        advertisement.setAdminComment(adminComment);
        advertisement.setUpdatedAt(LocalDateTime.now());

        Advertisement saved = advertisementRepository.save(advertisement);
        if (saved.getCreatedByUserId() != null) {
            notificationService.createFromTemplate(NotificationTemplate.advertisementApproved(saved.getCreatedByUserId(), saved.getId()));
        }
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public AdvertisementDTO rejectAdRequest(Long id, String adminComment) {
        Advertisement advertisement = advertisementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Advertisement", id));

        advertisement.setStatus(AdvertisementStatus.REJECTED);
        advertisement.setIsActive(false);
        advertisement.setPaymentStatus(PaymentStatus.FAILED);
        advertisement.setAdminComment(adminComment);
        advertisement.setUpdatedAt(LocalDateTime.now());

        Advertisement saved = advertisementRepository.save(advertisement);
        if (saved.getCreatedByUserId() != null) {
            notificationService.createFromTemplate(NotificationTemplate.advertisementRejected(saved.getCreatedByUserId(), saved.getId(), adminComment));
        }
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AdvertisementAnalyticsDTO getAdAnalytics(Long id) {
        Advertisement advertisement = advertisementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Advertisement", id));

        double ctr = 0.0;
        if (advertisement.getImpressions() != null && advertisement.getImpressions() > 0) {
            ctr = advertisement.getClicks() == null ? 0.0 : advertisement.getClicks() * 100.0 / advertisement.getImpressions();
        }

        return AdvertisementAnalyticsDTO.builder()
                .advertisementId(advertisement.getId())
                .views(advertisement.getViews())
                .clicks(advertisement.getClicks())
                .impressions(advertisement.getImpressions())
                .ctr(ctr)
                .status(advertisement.getStatus().name())
                .build();
    }

    @Override
    @Transactional
    public AdvertisementDTO updateAdMetrics(AdvertisementMetricsRequest request) {
        Advertisement advertisement = advertisementRepository.findById(request.getAdvertisementId())
                .orElseThrow(() -> new NotFoundException("Advertisement", request.getAdvertisementId()));

        if (request.getViewsIncrement() != null) {
            advertisement.setViews(advertisement.getViews() + request.getViewsIncrement());
        }
        if (request.getClicksIncrement() != null) {
            advertisement.setClicks(advertisement.getClicks() + request.getClicksIncrement());
        }
        if (request.getImpressionsIncrement() != null) {
            advertisement.setImpressions(advertisement.getImpressions() + request.getImpressionsIncrement());
        }

        advertisement.setUpdatedAt(LocalDateTime.now());
        Advertisement updated = advertisementRepository.save(advertisement);
        return mapToDTO(updated);
    }

    private AdvertisementDTO mapToDTO(Advertisement advertisement) {
        AdvertisementDTO dto = AdvertisementDTO.builder()
                .id(advertisement.getId())
                .title(advertisement.getTitle())
                .description(advertisement.getDescription())
                .imageUrl(advertisement.getImageUrl())
                .videoUrl(advertisement.getVideoUrl())
                .type(advertisement.getType())
                .propertyId(advertisement.getPropertyId())
                .isActive(advertisement.getIsActive())
                .status(advertisement.getStatus())
                .paymentStatus(advertisement.getPaymentStatus())
                .startDate(advertisement.getStartDate())
                .endDate(advertisement.getEndDate())
                .priority(advertisement.getPriority())
                .budget(advertisement.getBudget())
                .currency(advertisement.getCurrency())
                .targetAudience(advertisement.getTargetAudience())
                .paymentReference(advertisement.getPaymentReference())
                .adminComment(advertisement.getAdminComment())
                .createdByUserId(advertisement.getCreatedByUserId())
                .createdByUserEmail(advertisement.getCreatedByUserEmail())
                .views(advertisement.getViews())
                .clicks(advertisement.getClicks())
                .impressions(advertisement.getImpressions())
                .createdAt(advertisement.getCreatedAt())
                .updatedAt(advertisement.getUpdatedAt())
                .build();

        dto.setPlan(advertisement.getPlan());
        if (advertisement.getPropertyIds() != null && !advertisement.getPropertyIds().isEmpty()) {
            dto.setPropertyIds(Arrays.stream(advertisement.getPropertyIds().split(","))
                    .map(Long::valueOf)
                    .toList());
        }

        if (advertisement.getPropertyId() != null) {
            propertyRepository.findById(advertisement.getPropertyId())
                    .map(this::mapProperty)
                    .ifPresent(propertyDTO -> {
                        if (dto.getImageUrl() == null || dto.getImageUrl().isBlank()) {
                            if (propertyDTO.getImages() != null && !propertyDTO.getImages().isEmpty()) {
                                dto.setImageUrl(propertyDTO.getImages().get(0));
                            }
                        }
                        if (dto.getImageUrl() != null) {
                            propertyDTO.setImageUrl(dto.getImageUrl());
                        }
                        dto.setProperty(propertyDTO);
                    });
        }
        return dto;
    }

    private PropertyDTO mapProperty(Property property) {
        return PropertyDTO.builder()
                .id(property.getId())
                .title(property.getTitle())
                .description(property.getDescription())
                .price(property.getPrice())
                .additionalFees(property.getAdditionalFees() != null ? property.getAdditionalFees().doubleValue() : null)
                .discountPercentage(property.getDiscountPercentage() != null ? property.getDiscountPercentage().doubleValue() : null)
                .city(property.getCity())
                .address(property.getAddress())
                .latitude(property.getLatitude())
                .longitude(property.getLongitude())
                .images(property.getImages())
                .videoTour(property.getVideoTour())
                .ownerId(property.getOwner().getId())
                .ownerName(property.getOwner().getName())
                .createdAt(property.getCreatedAt())
                .build();
    }

    private Property loadLinkedProperty(Long propertyId) {
        if (propertyId == null) {
            return null;
        }
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property", propertyId));
    }
}
