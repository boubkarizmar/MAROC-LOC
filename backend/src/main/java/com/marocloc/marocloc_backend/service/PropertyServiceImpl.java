package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CreatePropertyRequest;
import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.exception.UnauthorizedException;
import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final FileValidationService fileValidationService;
    // =====================================================
    // CREATE PROPERTY
    // =====================================================
    @Override
    @Transactional
    @CacheEvict(value = {"properties", "cities", "propertyDetail"}, allEntries = true)
    public PropertyDTO createPropertyWithFiles(
            CreatePropertyRequest request,
            List<MultipartFile> images,
            MultipartFile video,
            MultipartFile cinImage,
            String ownerEmail
    ) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("User not found: " + ownerEmail));

        if (owner.getRole() != Role.PROPRIETAIRE) {
            throw new RuntimeException("Only PROPRIETAIRE users are allowed to create properties.");
        }
        // =====================================================
    // 💾 SAUVEGARDER LES IMAGES
    // =====================================================
    List<String> imageUrls = new ArrayList<>();
    if (images != null && !images.isEmpty()) {
        try {
            // Valider les images
            fileValidationService.validateImageFiles(images.toArray(new MultipartFile[0]));
            // Sauvegarder les images
            imageUrls = fileStorageService.saveImages(images);
            log.info("Saved {} images", imageUrls.size());
        } catch (Exception e) {
            log.error("Failed to save images", e);
            throw new RuntimeException("Failed to save images: " + e.getMessage());
        }
    }

    // =====================================================
    // 💾 SAUVEGARDER LA VIDÉO (optionnelle)
    // =====================================================
    String videoUrl = request.getVideoTour();
    if (video != null && !video.isEmpty()) {
        try {
            fileValidationService.validateVideoFile(video);
            videoUrl = fileStorageService.saveVideo(video);
            log.info("Saved video: {}", videoUrl);
        } catch (Exception e) {
            log.error("Failed to save video", e);
            throw new RuntimeException("Failed to save video: " + e.getMessage());
        }
    }

    // =====================================================
    // 💾 SAUVEGARDER L'IMAGE CIN (optionnelle)
    // =====================================================
    String cinImageUrl = null;
    if (cinImage != null && !cinImage.isEmpty()) {
        try {
            fileValidationService.validateCinImageFile(cinImage);
            cinImageUrl = fileStorageService.saveFile(cinImage);
            log.info("Saved CIN image: {}", cinImageUrl);
        } catch (Exception e) {
            log.error("Failed to save CIN image", e);
            throw new RuntimeException("Failed to save CIN image: " + e.getMessage());
        }
    }


        boolean userUpdated = false;

        if (request.getFirstNameArabic() != null) {
            owner.setFirstNameArabic(request.getFirstNameArabic());
            userUpdated = true;
        }
        if (request.getLastNameArabic() != null) {
            owner.setLastNameArabic(request.getLastNameArabic());
            userUpdated = true;
        }
        if (request.getFirstNameLatin() != null) {
            owner.setFirstNameLatin(request.getFirstNameLatin());
            userUpdated = true;
        }
        if (request.getLastNameLatin() != null) {
            owner.setLastNameLatin(request.getLastNameLatin());
            userUpdated = true;
        }
        if (request.getCin() != null) {
            owner.setCin(request.getCin());
            userUpdated = true;
        }
        String ownerCinImageUrl = cinImageUrl != null ? cinImageUrl : request.getCinImageUrl();
        if (ownerCinImageUrl != null) {
            owner.setCinImageUrl(ownerCinImageUrl);
            userUpdated = true;
        }

        if (userUpdated) {
            owner.setUpdatedAt(LocalDateTime.now());
            userRepository.save(owner);
        }

        Property property = new Property();

        // Basic info
        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setPrice(request.getPrice());
        property.setCity(request.getCity());
        property.setAddress(request.getAddress());

        // Type & Category
        property.setType(request.getType());
        property.setCategory(request.getCategory());
        property.setCustomCategory(request.getCustomCategory());
        property.setBillingPeriod(request.getBillingPeriod() != null ? request.getBillingPeriod() : BillingPeriod.MONTH);

        // Location
        property.setLatitude(request.getLatitude());
        property.setLongitude(request.getLongitude());

        // Contact
        property.setPhoneNumber(request.getPhoneNumber());
        property.setWhatsappNumber(request.getWhatsappNumber());

        // Fees & Discount
        property.setDiscountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0.0);
        property.setAdditionalFees(request.getAdditionalFees() != null ? request.getAdditionalFees() : 0.0);

        // Payment method
        property.setPaymentMethod(request.getPaymentMethod());

        // System fields
        property.setOwner(owner);
        property.setCreatedAt(LocalDateTime.now());
        property.setStatus(PropertyStatus.PENDING);

        // Caractéristiques physiques
        property.setSurface(request.getSurface());
        property.setRooms(request.getRooms());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setFloorNumber(request.getFloorNumber());
        property.setTotalFloors(request.getTotalFloors());
        property.setBuildingAge(request.getBuildingAge());
        property.setConstructionYear(request.getConstructionYear());
        property.setFurnished(request.getFurnished());
        property.setImages(imageUrls);

        if (request.getCondition() != null) {
            try {
                property.setCondition(PropertyCondition.valueOf(request.getCondition()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid condition value: {}", request.getCondition());
            }
        }

        // Équipements
        property.setHasElevator(request.getHasElevator());
        property.setHasParking(request.getHasParking());
        property.setHasPool(request.getHasPool());
        property.setHasGarden(request.getHasGarden());
        property.setHasAirConditioning(request.getHasAirConditioning());
        property.setHasInternet(request.getHasInternet());
        property.setHasSecurity(request.getHasSecurity());
        property.setHasBalcony(request.getHasBalcony());
        property.setPetAllowed(request.getPetAllowed());

        // Environnement
        property.setCityCenter(request.getCityCenter());
        property.setNearSchool(request.getNearSchool());
        property.setNearUniversity(request.getNearUniversity());
        property.setNearMosque(request.getNearMosque());
        property.setNearHospital(request.getNearHospital());
        property.setNearMarket(request.getNearMarket());
        property.setNearTram(request.getNearTram());
        property.setNearBus(request.getNearBus());
        property.setNearTrainStation(request.getNearTrainStation());

        // Quartier
        property.setPopularArea(request.getPopularArea());
        property.setModernArea(request.getModernArea());
        property.setQuietArea(request.getQuietArea());
        property.setFamilyArea(request.getFamilyArea());

        // Orientation et vues
        property.setSunDirection(request.getSunDirection());
        property.setGardenView(request.getGardenView());
        property.setStreetView(request.getStreetView());
        property.setSeaView(request.getSeaView());

        // Média
        property.setImages(imageUrls);
        property.setVideoTour(videoUrl);

        Property saved = propertyRepository.save(property);
        notificationService.createFromTemplate(NotificationTemplate.propertyCreated(owner.getId(), saved.getId()));
        log.info("Created property {} for user {}", saved.getId(), ownerEmail);

        return mapToDTO(saved);
    }

    // =====================================================
    // GET ALL PROPERTIES
    // =====================================================
    @Override
    @Transactional(readOnly = true)
    public Page<PropertyDTO> getAllProperties(Pageable pageable) {
        return propertyRepository.findAll(pageable).map(this::mapToDTO);
    }

    // =====================================================
    // GET BY OWNER
    // =====================================================
    @Override
    @Transactional(readOnly = true)
    public Page<PropertyDTO> getPropertiesByOwner(String ownerEmail, Pageable pageable) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("User not found: " + ownerEmail));
        return propertyRepository.findByOwnerId(owner.getId(), pageable).map(this::mapToDTO);
    }

    // =====================================================
    // GET BY ID
    // =====================================================
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "propertyDetail", key = "#id")
    public PropertyDTO getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found: " + id));
        return mapToDTO(property);
    }

    // =====================================================
    // SEARCH (advanced filters) - VERSION CORRIGÉE
    // =====================================================
    // =====================================================
// SEARCH (advanced filters) - VERSION CORRIGÉE
// =====================================================
@Override
@Transactional(readOnly = true)
public Page<PropertyDTO> searchProperties(
        Long ownerId,
        String keyword,
        String city,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String type,
        String category,
        Double latitude,
        Double longitude,
        Double radiusKm,
        Integer minRooms,
        Integer maxRooms,
        Double minSurface,
        Double maxSurface,
        Integer minFloor,
        Integer maxFloor,
        Integer minBuildingAge,
        Integer maxBuildingAge,
        Boolean furnished,
        Boolean hasParking,
        Boolean hasPool,
        Boolean hasElevator,
        Boolean hasAirConditioning,
        Boolean hasInternet,
        Boolean hasSecurity,
        Boolean hasBalcony,
        Boolean petAllowed,
        Boolean cityCenter,
        Boolean nearSchool,
        Boolean nearUniversity,
        Boolean nearMosque,
        Boolean nearHospital,
        Boolean nearMarket,
        Boolean nearTram,
        Boolean nearBus,
        Boolean nearTrainStation,
        Boolean popularArea,
        Boolean modernArea,
        Boolean quietArea,
        Boolean familyArea,
        SunDirection sunDirection,
        Boolean gardenView,
        Boolean streetView,
        Boolean seaView,
        PaymentMethod paymentMethod,
        Pageable pageable) {

    if (ownerId != null) {
        return propertyRepository.findByOwnerId(ownerId, pageable).map(this::mapToDTO);
    }

    // Convertir les enum en String
    String sunDirStr = sunDirection != null ? sunDirection.name() : null;
    String paymentMethodStr = paymentMethod != null ? paymentMethod.name() : null;

    Page<Property> properties = propertyRepository.findPropertiesWithDynamicFilters(
            keyword, city, minPrice, maxPrice, type, category, null, null,
            latitude, longitude, radiusKm,
            minRooms, maxRooms, minSurface, maxSurface,
            furnished, hasParking, hasPool,
            hasElevator, hasAirConditioning, hasInternet, hasSecurity,
            hasBalcony, petAllowed,
            cityCenter, nearSchool, nearUniversity, nearMosque,
            nearHospital, nearMarket, nearTram, nearBus, nearTrainStation,
            popularArea, modernArea, quietArea, familyArea,
            sunDirStr, gardenView, streetView, seaView,
            paymentMethodStr, pageable);

    return properties.map(this::mapToDTO);
}
    // =====================================================
    // UPDATE PROPERTY
    // =====================================================
    @Override
    @Transactional
    @CacheEvict(value = {"properties", "cities", "propertyDetail"}, allEntries = true)
    public PropertyDTO updateProperty(Long id, PropertyDTO dto, String ownerEmail) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found: " + id));

        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("User not found: " + ownerEmail));

        boolean isOwner = property.getOwner().getEmail().equals(ownerEmail);
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to delete this property");
        }

        // Basic info
        if (dto.getTitle() != null) property.setTitle(dto.getTitle());
        if (dto.getDescription() != null) property.setDescription(dto.getDescription());
        if (dto.getPrice() != null) property.setPrice(dto.getPrice());
        if (dto.getCity() != null) property.setCity(dto.getCity());
        if (dto.getAddress() != null) property.setAddress(dto.getAddress());
        if (dto.getLatitude() != null) property.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) property.setLongitude(dto.getLongitude());

        // Type & Category
        if (dto.getType() != null) property.setType(dto.getType());
        if (dto.getCategory() != null) property.setCategory(dto.getCategory());
        if (dto.getCustomCategory() != null) property.setCustomCategory(dto.getCustomCategory());

        // Contact
        if (dto.getPhoneNumber() != null) property.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getWhatsappNumber() != null) property.setWhatsappNumber(dto.getWhatsappNumber());

        // Financial
        if (dto.getDiscountPercentage() != null) property.setDiscountPercentage(dto.getDiscountPercentage());
        if (dto.getAdditionalFees() != null) property.setAdditionalFees(dto.getAdditionalFees());
        if (dto.getPaymentMethod() != null) property.setPaymentMethod(dto.getPaymentMethod());

        // Status
        if (dto.getStatus() != null) property.setStatus(dto.getStatus());

        // Media
        if (dto.getImages() != null) property.setImages(dto.getImages());
        if (dto.getVideoTour() != null) property.setVideoTour(dto.getVideoTour());

        // Property details
        if (dto.getSurface() != null) property.setSurface(dto.getSurface());
        if (dto.getRooms() != null) property.setRooms(dto.getRooms());
        if (dto.getBedrooms() != null) property.setBedrooms(dto.getBedrooms());
        if (dto.getBathrooms() != null) property.setBathrooms(dto.getBathrooms());
        if (dto.getFloorNumber() != null) property.setFloorNumber(dto.getFloorNumber());
        if (dto.getTotalFloors() != null) property.setTotalFloors(dto.getTotalFloors());
        if (dto.getBuildingAge() != null) property.setBuildingAge(dto.getBuildingAge());
        if (dto.getConstructionYear() != null) property.setConstructionYear(dto.getConstructionYear());
        if (dto.getCondition() != null) {
            try {
                property.setCondition(PropertyCondition.valueOf(dto.getCondition()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid condition value: {}", dto.getCondition());
            }
        }
        if (dto.getFurnished() != null) property.setFurnished(dto.getFurnished());

        // Features
        if (dto.getHasElevator() != null) property.setHasElevator(dto.getHasElevator());
        if (dto.getHasParking() != null) property.setHasParking(dto.getHasParking());
        if (dto.getHasPool() != null) property.setHasPool(dto.getHasPool());
        if (dto.getHasGarden() != null) property.setHasGarden(dto.getHasGarden());
        if (dto.getHasAirConditioning() != null) property.setHasAirConditioning(dto.getHasAirConditioning());
        if (dto.getHasInternet() != null) property.setHasInternet(dto.getHasInternet());
        if (dto.getHasSecurity() != null) property.setHasSecurity(dto.getHasSecurity());
        if (dto.getHasBalcony() != null) property.setHasBalcony(dto.getHasBalcony());
        if (dto.getPetAllowed() != null) property.setPetAllowed(dto.getPetAllowed());

        // Location features
        if (dto.getCityCenter() != null) property.setCityCenter(dto.getCityCenter());
        if (dto.getNearSchool() != null) property.setNearSchool(dto.getNearSchool());
        if (dto.getNearUniversity() != null) property.setNearUniversity(dto.getNearUniversity());
        if (dto.getNearMosque() != null) property.setNearMosque(dto.getNearMosque());
        if (dto.getNearHospital() != null) property.setNearHospital(dto.getNearHospital());
        if (dto.getNearMarket() != null) property.setNearMarket(dto.getNearMarket());
        if (dto.getNearTram() != null) property.setNearTram(dto.getNearTram());
        if (dto.getNearBus() != null) property.setNearBus(dto.getNearBus());
        if (dto.getNearTrainStation() != null) property.setNearTrainStation(dto.getNearTrainStation());

        // Area type
        if (dto.getPopularArea() != null) property.setPopularArea(dto.getPopularArea());
        if (dto.getModernArea() != null) property.setModernArea(dto.getModernArea());
        if (dto.getQuietArea() != null) property.setQuietArea(dto.getQuietArea());
        if (dto.getFamilyArea() != null) property.setFamilyArea(dto.getFamilyArea());

        // View orientation
        if (dto.getSunDirection() != null) property.setSunDirection(dto.getSunDirection());
        if (dto.getGardenView() != null) property.setGardenView(dto.getGardenView());
        if (dto.getStreetView() != null) property.setStreetView(dto.getStreetView());
        if (dto.getSeaView() != null) property.setSeaView(dto.getSeaView());

        return mapToDTO(propertyRepository.save(property));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"properties", "cities", "propertyDetail"}, allEntries = true)
    public PropertyDTO updatePropertyWithFiles(Long id, PropertyDTO dto, List<MultipartFile> images, List<MultipartFile> newImages, String ownerEmail) {
        // First update basic fields
        PropertyDTO updated = updateProperty(id, dto, ownerEmail);

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found: " + id));

        // Handle new image uploads
        List<MultipartFile> allNewImages = new ArrayList<>();
        if (images != null) allNewImages.addAll(images);
        if (newImages != null) allNewImages.addAll(newImages);

        if (!allNewImages.isEmpty()) {
            try {
                fileValidationService.validateImageFiles(allNewImages.toArray(new MultipartFile[0]));
                List<String> newImageUrls = fileStorageService.saveImages(allNewImages);

                // Merge with existing images
                List<String> existingImages = property.getImages() != null ? new ArrayList<>(property.getImages()) : new ArrayList<>();
                existingImages.addAll(newImageUrls);
                property.setImages(existingImages);

                log.info("Added {} new images to property {}", newImageUrls.size(), id);
            } catch (Exception e) {
                log.error("Failed to save images for property update", e);
                throw new RuntimeException("Failed to save images: " + e.getMessage());
            }
        }

        return mapToDTO(propertyRepository.save(property));
    }

    // =====================================================
    // DELETE PROPERTY
    // =====================================================
    @Override
    @Transactional
    @CacheEvict(value = {"properties", "cities", "propertyDetail"}, allEntries = true)
    public void deleteProperty(Long id, String ownerEmail) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found"));

        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean isOwner = property.getOwner().getEmail().equals(ownerEmail);
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Not allowed");
        }

        propertyRepository.delete(property);
    }

    // =====================================================
    // GET STATISTICS
    // =====================================================
    @Override
    public PropertyStatistics getPropertyStatistics() {
        long totalProperties = propertyRepository.count();
        long pendingProperties = propertyRepository.countByStatus(PropertyStatus.PENDING);
        long approvedProperties = propertyRepository.countByStatus(PropertyStatus.APPROVED);
        long rejectedProperties = propertyRepository.countByStatus(PropertyStatus.REJECTED);

        Object[] priceStats = propertyRepository.getPriceStatisticsByStatus(PropertyStatus.APPROVED);
        BigDecimal averagePrice = null;
        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;

        if (priceStats != null && priceStats.length >= 3) {
            if (priceStats[0] != null) averagePrice = (BigDecimal) priceStats[0];
            if (priceStats[1] != null) minPrice = (BigDecimal) priceStats[1];
            if (priceStats[2] != null) maxPrice = (BigDecimal) priceStats[2];
        }

        List<String> availableCities = propertyRepository.findDistinctCitiesByStatus(
            List.of(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE)
        );

        List<String> propertyTypes = List.of("RENT", "BUY", "MORTGAGE");
        List<String> categories = List.of("HOUSE", "APARTMENT", "LAND", "COMMERCIAL");

        // Optimized aggregation queries instead of loading entire table
        long totalViews = propertyRepository.sumViewCount();

        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
        long propertiesThisMonth = propertyRepository.countCreatedSince(startOfMonth);

        double averageDiscountPercentage = propertyRepository.averageDiscountPercentage();

        // Single aggregation query for all city stats
        List<Object[]> cityAgg = propertyRepository.getCityAggregation();
        List<PropertyStatistics.CityStats> cityStats = cityAgg.stream()
                .filter(row -> row[0] != null)
                .map(row -> PropertyStatistics.CityStats.builder()
                        .city((String) row[0])
                        .propertyCount(((Number) row[1]).longValue())
                        .averagePrice(((Number) row[2]).doubleValue())
                        .totalViews(((Number) row[3]).longValue())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return PropertyStatistics.builder()
                .totalProperties(totalProperties)
                .pendingProperties(pendingProperties)
                .approvedProperties(approvedProperties)
                .rejectedProperties(rejectedProperties)
                .averagePrice(averagePrice)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .availableCities(availableCities)
                .propertyTypes(propertyTypes)
                .categories(categories)
                .totalViews(totalViews)
                .propertiesThisMonth(propertiesThisMonth)
                .averageDiscountPercentage(averageDiscountPercentage)
                .cityStats(cityStats)
                .build();
    }

    // =====================================================
    // GET ALL DISTINCT CITIES
    // =====================================================
    @Override
    public List<String> getAllDistinctCities() {
        return propertyRepository.findDistinctCities();
    }

    // =====================================================
    // MAPPER ENTITY -> DTO
    // =====================================================
private PropertyDTO mapToDTO(Property property) {
    if (property == null) return null;

    return PropertyDTO.builder()
            // =====================
            // BASIC INFO
            // =====================
            .id(property.getId())
            .title(property.getTitle())
            .description(property.getDescription())
            .price(property.getPrice())
            .city(property.getCity())
            .address(property.getAddress())
            .latitude(property.getLatitude())
            .longitude(property.getLongitude())

            // =====================
            // TYPE & CATEGORY
            // =====================
            .type(property.getType())
            .category(property.getCategory())
            .customCategory(property.getCustomCategory())

            // =====================
            // CONTACT
            // =====================
            .phoneNumber(property.getPhoneNumber())
            .whatsappNumber(property.getWhatsappNumber())

            // =====================
            // FINANCIAL
            // =====================
            .discountPercentage(property.getDiscountPercentage())
            .additionalFees(property.getAdditionalFees())
            .paymentMethod(property.getPaymentMethod())

            // =====================
            // STATUS & SYSTEM
            // =====================
            .status(property.getStatus())
            .viewCount(property.getViewCount())
            .ownerId(property.getOwner() != null ? property.getOwner().getId() : null)
            .ownerName(property.getOwner() != null ? property.getOwner().getName() : null)
            .createdAt(property.getCreatedAt())
            .updatedAt(property.getUpdatedAt())
            .approvedAt(property.getApprovedAt())
            .rejectionReason(property.getRejectionReason())

            // =====================
            // MEDIA (IMAGES + VIDEO)
            // =====================
            .images(property.getImages())
            .videoTour(property.getVideoTour())

            // =====================
            // PROPERTY DETAILS
            // =====================
            .surface(property.getSurface())
            .rooms(property.getRooms())
            .bedrooms(property.getBedrooms())
            .bathrooms(property.getBathrooms())
            .floorNumber(property.getFloorNumber())
            .totalFloors(property.getTotalFloors())
            .buildingAge(property.getBuildingAge())
            .constructionYear(property.getConstructionYear())
            .condition(property.getCondition() != null ? property.getCondition().name() : null)
            .furnished(property.getFurnished())

            // =====================
            // FEATURES
            // =====================
            .hasElevator(property.getHasElevator())
            .hasParking(property.getHasParking())
            .hasPool(property.getHasPool())
            .hasGarden(property.getHasGarden())
            .hasAirConditioning(property.getHasAirConditioning())
            .hasInternet(property.getHasInternet())
            .hasSecurity(property.getHasSecurity())
            .hasBalcony(property.getHasBalcony())
            .petAllowed(property.getPetAllowed())

            // =====================
            // LOCATION FEATURES
            // =====================
            .cityCenter(property.getCityCenter())
            .nearSchool(property.getNearSchool())
            .nearUniversity(property.getNearUniversity())
            .nearMosque(property.getNearMosque())
            .nearHospital(property.getNearHospital())
            .nearMarket(property.getNearMarket())
            .nearTram(property.getNearTram())
            .nearBus(property.getNearBus())
            .nearTrainStation(property.getNearTrainStation())

            // =====================
            // AREA TYPE
            // =====================
            .popularArea(property.getPopularArea())
            .modernArea(property.getModernArea())
            .quietArea(property.getQuietArea())
            .familyArea(property.getFamilyArea())

            // =====================
            // VIEW ORIENTATION
            // =====================
            .sunDirection(property.getSunDirection())
            .gardenView(property.getGardenView())
            .streetView(property.getStreetView())
            .seaView(property.getSeaView())

            // =====================
            // CALCULATED FIELDS
            // =====================
            .pricePerSquareMeter(
                    (property.getSurface() != null
                            && property.getSurface() > 0
                            && property.getPrice() != null)
                            ? property.getPrice().doubleValue() / property.getSurface()
                            : null
            )

            .build();
}
}
