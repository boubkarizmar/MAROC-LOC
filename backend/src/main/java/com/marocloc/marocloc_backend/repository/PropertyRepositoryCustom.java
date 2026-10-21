package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

/**
 * Custom repository interface for QueryDSL-based property queries
 * Provides type-safe dynamic query capabilities
 */
public interface PropertyRepositoryCustom {

    List<String> findDistinctCities();

    Page<Property> findPropertiesWithDynamicFilters(
        String keyword,
        String city,
        java.math.BigDecimal minPrice,
        java.math.BigDecimal maxPrice,
        String type,
        String category,
        String status,
        Boolean isVerified,
        Double latitude,
        Double longitude,
        Double radiusKm,
        Integer minRooms,
        Integer maxRooms,
        Double minSurface,
        Double maxSurface,
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
        String sunDirection,
        Boolean gardenView,
        Boolean streetView,
        Boolean seaView,
        String paymentMethod,
        Pageable pageable);

    Page<Property> findNearbyPropertiesPostGIS(
        Double latitude,
        Double longitude,
        Double radiusKm,
        Pageable pageable);
}