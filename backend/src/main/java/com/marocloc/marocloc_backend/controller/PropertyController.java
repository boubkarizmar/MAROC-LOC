package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.dto.CategoryCountDTO;
import com.marocloc.marocloc_backend.dto.CityStatsDTO;
import com.marocloc.marocloc_backend.dto.CityStatsDetailedDTO;
import com.marocloc.marocloc_backend.dto.CreatePropertyRequest;
import com.marocloc.marocloc_backend.dto.OwnerRankingDTO;
import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.dto.PropertyRankedDTO;
import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.model.PropertyCategory;
import com.marocloc.marocloc_backend.model.PropertyReservationTransactionType;
import com.marocloc.marocloc_backend.model.PropertyType;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.PropertyReservationService;
import com.marocloc.marocloc_backend.service.PropertyScoringService;
import com.marocloc.marocloc_backend.service.PropertyService;
import com.marocloc.marocloc_backend.service.PropertyStatistics;
import com.marocloc.marocloc_backend.service.FileValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
//@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping(ApiRoutes.PROPERTIES_V2)
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final com.marocloc.marocloc_backend.service.FileStorageService fileStorageService;
    private final PropertyScoringService propertyScoringService;
    private final PropertyRepository propertyRepository;
    private final FileValidationService fileValidationService;
    private final PropertyReservationService propertyReservationService;
    private final UserRepository userRepository;

    // =====================================================
    // ENUM / FILTER OPTION ENDPOINTS
    // =====================================================

    /**
     * Returns all available property categories.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = Arrays.stream(PropertyCategory.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    /**
     * Returns all available transaction/property types.
     */
    @GetMapping("/transaction-types")
    public ResponseEntity<List<String>> getTransactionTypes() {
        List<String> types = Arrays.stream(PropertyType.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    // =====================================================
    // MAIN CRUD ENDPOINTS
    // =====================================================

    /**
     * Get all properties with pagination. Public endpoint.
     */
    @GetMapping
    public ResponseEntity<Page<PropertyDTO>> getAllProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(propertyService.getAllProperties(pageable));
    }

    /**
     * Get properties owned by the currently authenticated user.
     * Restricted to PROPRIETAIRE role only.
     */
    @GetMapping("/my-properties")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<Page<PropertyDTO>> getMyProperties(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                propertyService.getPropertiesByOwner(userDetails.getUsername(), pageable));
    }

    /**
     * Get a single property by ID. Public endpoint.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PropertyDTO> getPropertyById(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.getPropertyById(id));
    }

    /**
     * Get all distinct cities from properties.
     */
    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAllCities() {
        List<String> cities = propertyService.getAllDistinctCities();
        return ResponseEntity.ok(cities);
    }

    /**
     * Search properties with multiple filters.
     */
    @GetMapping("/search")
    public ResponseEntity<Page<PropertyDTO>> searchProperties(
            // Recherche texte
            @RequestParam(required = false) String keyword,

            // Localisation
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radiusKm,

            // Prix
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,

            // Type et catégorie
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,

            // Caractéristiques physiques
            @RequestParam(required = false) Integer minRooms,
            @RequestParam(required = false) Integer maxRooms,
            @RequestParam(required = false) Double minSurface,
            @RequestParam(required = false) Double maxSurface,
            @RequestParam(required = false) Integer minFloor,
            @RequestParam(required = false) Integer maxFloor,
            @RequestParam(required = false) Integer minBuildingAge,
            @RequestParam(required = false) Integer maxBuildingAge,

            // Équipements
            @RequestParam(required = false) Boolean furnished,
            @RequestParam(required = false) Boolean hasParking,
            @RequestParam(required = false) Boolean hasPool,
            @RequestParam(required = false) Boolean hasElevator,
            @RequestParam(required = false) Boolean hasAirConditioning,
            @RequestParam(required = false) Boolean hasInternet,
            @RequestParam(required = false) Boolean hasSecurity,
            @RequestParam(required = false) Boolean hasBalcony,
            @RequestParam(required = false) Boolean petAllowed,

            // Environnement
            @RequestParam(required = false) Boolean cityCenter,
            @RequestParam(required = false) Boolean nearSchool,
            @RequestParam(required = false) Boolean nearUniversity,
            @RequestParam(required = false) Boolean nearMosque,
            @RequestParam(required = false) Boolean nearHospital,
            @RequestParam(required = false) Boolean nearMarket,
            @RequestParam(required = false) Boolean nearTram,
            @RequestParam(required = false) Boolean nearBus,
            @RequestParam(required = false) Boolean nearTrainStation,

            // Quartier
            @RequestParam(required = false) Boolean popularArea,
            @RequestParam(required = false) Boolean modernArea,
            @RequestParam(required = false) Boolean quietArea,
            @RequestParam(required = false) Boolean familyArea,

            // Orientation et vues
            @RequestParam(required = false) String sunDirection,
            @RequestParam(required = false) Boolean gardenView,
            @RequestParam(required = false) Boolean streetView,
            @RequestParam(required = false) Boolean seaView,

            // Méthodes de paiement
            @RequestParam(required = false) String paymentMethod,

            // Sort & Filter
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Long ownerId,

            // Pagination
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0];
            org.springframework.data.domain.Sort.Direction direction = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1]))
                    ? org.springframework.data.domain.Sort.Direction.ASC
                    : org.springframework.data.domain.Sort.Direction.DESC;
            pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(direction, property));
        } else {
            pageable = PageRequest.of(page, size);
        }

        // Convertir sunDirection enum si présent
        com.marocloc.marocloc_backend.model.SunDirection sunDir = null;
        if (sunDirection != null && !sunDirection.isEmpty()) {
            try {
                sunDir = com.marocloc.marocloc_backend.model.SunDirection.valueOf(sunDirection.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid sun direction: {}", sunDirection);
            }
        }

        // Convertir paymentMethod enum si présent
        com.marocloc.marocloc_backend.model.PaymentMethod payment = null;
        if (paymentMethod != null && !paymentMethod.isEmpty()) {
            try {
                payment = com.marocloc.marocloc_backend.model.PaymentMethod.valueOf(paymentMethod.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid payment method: {}", paymentMethod);
            }
        }

        return ResponseEntity.ok(propertyService.searchProperties(
                ownerId, keyword, city, minPrice, maxPrice, type, category,
                latitude, longitude, radiusKm,
                minRooms, maxRooms, minSurface, maxSurface,
                minFloor, maxFloor, minBuildingAge, maxBuildingAge,
                furnished, hasParking, hasPool, hasElevator,
                hasAirConditioning, hasInternet, hasSecurity, hasBalcony, petAllowed,
                cityCenter, nearSchool, nearUniversity, nearMosque, nearHospital,
                nearMarket, nearTram, nearBus, nearTrainStation,
                popularArea, modernArea, quietArea, familyArea,
                sunDir, gardenView, streetView, seaView, payment, pageable));
    }

    // =====================================================
    // CREATE ENDPOINTS
    // =====================================================

    /**
     * Create a new property with optional image and video uploads.
     * Restricted to PROPRIETAIRE role only.
     */
    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    @CacheEvict(value = {"properties", "searchResults", "recommendations"}, allEntries = true)
    public ResponseEntity<PropertyDTO> createProperty(
            @Valid @RequestPart("property") CreatePropertyRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "video", required = false) MultipartFile video,
            @RequestPart(value = "cinImage", required = false) MultipartFile cinImage,
            @AuthenticationPrincipal UserDetails userDetails) {
        PropertyDTO created = propertyService.createPropertyWithFiles(
                request, images, video, cinImage, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Create a new property with JSON (simplified version for testing)
     */
    @PostMapping(value = "/json", consumes = {"application/json"})
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<PropertyDTO> createPropertyJson(
            @Valid @RequestBody CreatePropertyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PropertyDTO created = propertyService.createPropertyWithFiles(
                request, null, null, null, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    /**
 * Create a new property with JSON AND image uploads (multipart)
 * This endpoint supports both JSON data and images.
 */
@PostMapping(value = "/json-with-images", consumes = {"multipart/form-data"})
@PreAuthorize("hasRole('PROPRIETAIRE')")
public ResponseEntity<PropertyDTO> createPropertyJsonWithImages(
        @Valid @RequestPart("property") CreatePropertyRequest request,
        @RequestPart(value = "images", required = false) List<MultipartFile> images,
        @AuthenticationPrincipal UserDetails userDetails) {
    PropertyDTO created = propertyService.createPropertyWithFiles(
            request, images, null, null, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}

    // =====================================================
    // UPDATE & DELETE ENDPOINTS
    // =====================================================

    /**
     * Update an existing property. Only the owner or ADMIN can update.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @CacheEvict(value = {"properties", "propertyDetail", "searchResults", "recommendations"}, key = "#id")
    public ResponseEntity<PropertyDTO> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody PropertyDTO propertyDTO,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                propertyService.updateProperty(id, propertyDTO, userDetails.getUsername()));
    }

    /**
     * Update an existing property with image uploads.
     * Only the owner or ADMIN can update.
     */
    @PutMapping(value = "/{id}/with-images", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @CacheEvict(value = {"properties", "propertyDetail", "searchResults", "recommendations"}, key = "#id")
    public ResponseEntity<PropertyDTO> updatePropertyWithImages(
            @PathVariable Long id,
            @Valid @RequestPart("property") PropertyDTO propertyDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages,
            @AuthenticationPrincipal UserDetails userDetails) {
        PropertyDTO updated = propertyService.updatePropertyWithFiles(
                id, propertyDTO, images, newImages, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a property. Only the owner or ADMIN can delete.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    @CacheEvict(value = {"properties", "propertyDetail", "searchResults", "recommendations"}, key = "#id")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        propertyService.deleteProperty(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /**
     * Get property statistics for dashboard. Restricted to ADMIN role.
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PropertyStatistics> getStatistics() {
        return ResponseEntity.ok(propertyService.getPropertyStatistics());
    }

    /**
     * Get top-ranked properties with computed final score.
     */
    @GetMapping("/top-ranked")
    public ResponseEntity<Page<PropertyRankedDTO>> getTopRankedProperties(
            @RequestParam(defaultValue = "10") int limit) {
        List<PropertyRankedDTO> ranked = propertyScoringService.getTopRankedProperties(limit);
        Pageable pageable = PageRequest.of(0, limit);
        return ResponseEntity.ok(new PageImpl<>(ranked, pageable, ranked.size()));
    }

    /**
     * Get city statistics with property counts.
     */
    @GetMapping("/city-stats")
    public ResponseEntity<List<CityStatsDTO>> getCityStats() {
        List<Object[]> aggregation = propertyRepository.getCityAggregation();
        List<CityStatsDTO> result = aggregation.stream()
                .map(row -> CityStatsDTO.builder()
                        .name((String) row[0])
                        .slug(((String) row[0]).toLowerCase().replace(" ", "-"))
                        .propertyCount(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Get category counts for all property categories with growth rate.
     */
    @GetMapping("/category-counts")
    public ResponseEntity<List<CategoryCountDTO>> getCategoryCounts() {
        List<Object[]> rows = propertyRepository.countByCategoryWithGrowth();
        List<CategoryCountDTO> result = rows.stream()
                .map(row -> {
                    String category = (String) row[0];
                    Long totalCount = ((Number) row[1]).longValue();
                    Long currentMonth = ((Number) row[2]).longValue();
                    Long previousMonth = ((Number) row[3]).longValue();
                    double growthRate = previousMonth > 0
                            ? ((double) (currentMonth - previousMonth) / previousMonth) * 100.0
                            : (currentMonth > 0 ? 100.0 : 0.0);
                    return CategoryCountDTO.builder()
                            .category(category)
                            .count(totalCount)
                            .growthRate(Math.round(growthRate * 10.0) / 10.0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Get detailed city statistics including average price.
     */
    @GetMapping("/city-stats/detailed")
    public ResponseEntity<List<CityStatsDetailedDTO>> getCityStatsDetailed() {
        List<Object[]> aggregation = propertyRepository.getCityAggregation();
        List<CityStatsDetailedDTO> result = aggregation.stream()
                .map(row -> CityStatsDetailedDTO.builder()
                        .name((String) row[0])
                        .slug(((String) row[0]).toLowerCase().replace(" ", "-"))
                        .propertyCount(((Number) row[1]).longValue())
                        .averagePrice(((Number) row[2]).doubleValue())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Get top owner rankings with weighted score.
     * Formula: 40% rating, 25% active properties, 15% premium ads, 10% response rate, 10% visits.
     */
    @GetMapping("/owner-rankings")
    public ResponseEntity<List<OwnerRankingDTO>> getOwnerRankings() {
        List<Object[]> rows = propertyRepository.getOwnerRankingsRaw();
        List<OwnerRankingDTO> rankings = rows.stream()
                .map(row -> {
                    Long userId = ((Number) row[0]).longValue();
                    String name = (String) row[1];
                    String avatar = row[2] != null ? (String) row[2] : null;
                    String city = row[3] != null ? (String) row[3] : null;
                    Boolean verified = row[4] != null ? (Boolean) row[4] : false;
                    Long propertyCount = ((Number) row[5]).longValue();
                    Double averageRating = ((Number) row[6]).doubleValue();
                    Long reviewCount = ((Number) row[7]).longValue();
                    Double responseRate = row[8] != null ? ((Number) row[8]).doubleValue() : 0.0;
                    Long premiumAdCount = row[9] != null ? ((Number) row[9]).longValue() : 0L;
                    Long visitCount = row[10] != null ? ((Number) row[10]).longValue() : 0L;

                    // Normalize each metric to 0-100
                    double ratingNorm = (averageRating / 5.0) * 100.0;
                    double propertiesNorm = Math.min(100.0, propertyCount * 5.0);
                    double premiumNorm = Math.min(100.0, premiumAdCount * 20.0);
                    double responseNorm = Math.min(100.0, responseRate);
                    double visitsNorm = Math.min(100.0, visitCount * 10.0);

                    // Weighted score
                    double score = (ratingNorm * 0.40)
                                 + (propertiesNorm * 0.25)
                                 + (premiumNorm * 0.15)
                                 + (responseNorm * 0.10)
                                 + (visitsNorm * 0.10);

                    return OwnerRankingDTO.builder()
                            .userId(userId)
                            .name(name)
                            .avatar(avatar)
                            .city(city)
                            .propertyCount(propertyCount)
                            .averageRating(Math.round(averageRating * 10.0) / 10.0)
                            .reviewCount(reviewCount)
                            .responseRate(Math.round(responseRate * 10.0) / 10.0)
                            .premiumAdCount(premiumAdCount)
                            .visitCount(visitCount)
                            .verified(verified)
                            .score(Math.round(score * 100.0) / 100.0)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(10)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rankings);
    }
// =====================================================
// MEDIA ENDPOINTS
// =====================================================

/**
 * Create property with video + images
 */
@PostMapping(value = "/with-video", consumes = {"multipart/form-data"})
@PreAuthorize("hasRole('PROPRIETAIRE')")
public ResponseEntity<PropertyDTO> createPropertyWithVideo(
        @Valid @RequestPart("property") CreatePropertyRequest request,

        @RequestPart(value = "video", required = false)
        MultipartFile video,

        @RequestPart(value = "images", required = false)
        List<MultipartFile> images,

        @AuthenticationPrincipal UserDetails userDetails) {

    log.info("Creating property with video/images for user: {}",
            userDetails.getUsername());

    // =====================================================
    // VIDEO VALIDATION + SAVE
    // =====================================================

    if (video != null && !video.isEmpty()) {

        log.info("Video received: {}", video.getOriginalFilename());

        // Delegate validation to FileValidationService
        fileValidationService.validateVideoFile(video);

        // Save video
        String videoUrl = fileStorageService.saveVideo(video);

        log.info("Video saved successfully: {}", videoUrl);

        request.setVideoTour(videoUrl);
    }

    // =====================================================
    // CREATE PROPERTY
    // =====================================================

    PropertyDTO created = propertyService.createPropertyWithFiles(
            request,
            images,
            null,
            null,
            userDetails.getUsername());

    log.info("Property created successfully with id: {}",
            created.getId());

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(created);
}

/**
 * Stream video/image/file
 */
@GetMapping("/media/{filename:.+}")
public ResponseEntity<?> getMedia(
        @PathVariable String filename) {

    log.info("Accessing media file: {}", filename);

    return fileStorageService.streamFile(filename);

}

    // =====================================================
    // RESERVATION / PURCHASE ENDPOINTS
    // =====================================================

    @PostMapping("/{id}/reserve")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reserveProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "fr") String lang) {
        User user = resolveUser(userDetails);
        Map<String, Object> paymentParams = propertyReservationService.initiateTransaction(
                id, PropertyReservationTransactionType.RESERVATION, user.getId(), user.getEmail(), lang);
        return ResponseEntity.ok(ApiResponse.success(paymentParams));
    }

    @PostMapping("/{id}/buy")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> buyProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "fr") String lang) {
        User user = resolveUser(userDetails);
        Map<String, Object> paymentParams = propertyReservationService.initiateTransaction(
                id, PropertyReservationTransactionType.PURCHASE, user.getId(), user.getEmail(), lang);
        return ResponseEntity.ok(ApiResponse.success(paymentParams));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userDetails.getUsername()));
    }
}
