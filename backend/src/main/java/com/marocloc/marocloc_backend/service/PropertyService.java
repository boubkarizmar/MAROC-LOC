package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CreatePropertyRequest;
import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.model.PaymentMethod;
import com.marocloc.marocloc_backend.model.SunDirection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface PropertyService {

    PropertyDTO createPropertyWithFiles(CreatePropertyRequest request,
                                        List<MultipartFile> images,
                                        MultipartFile video,
                                        MultipartFile cinImage,
                                        String ownerEmail);

    Page<PropertyDTO> getAllProperties(Pageable pageable);

    Page<PropertyDTO> getPropertiesByOwner(String ownerEmail, Pageable pageable);

    PropertyDTO getPropertyById(Long id);
    Page<PropertyDTO> searchProperties(
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
    Pageable pageable);


    PropertyDTO updateProperty(Long id, PropertyDTO propertyDTO, String ownerEmail);

    PropertyDTO updatePropertyWithFiles(Long id, PropertyDTO propertyDTO, List<MultipartFile> images, List<MultipartFile> newImages, String ownerEmail);

    void deleteProperty(Long id, String ownerEmail);

    PropertyStatistics getPropertyStatistics();

    List<String> getAllDistinctCities();
}