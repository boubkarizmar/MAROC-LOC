package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.marocloc.marocloc_backend.model.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Property DTO
 * Used for API requests and responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyDTO {

    // ===== IDENTIFIANTS =====
    private Long id;
    private Long viewCount;

    // ===== INFORMATIONS PRINCIPALES =====
    @NotBlank(message = "Title is required")
    private String title;

    @Size(min = 30, message = "Description must be at least 30 characters")
    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Address is required")
    private String address;

    // ===== IMAGES =====
    private String imageUrl;
    private List<String> images;
    private String videoTour;

    // ===== TYPE & CATÉGORIE =====
    @JsonProperty("discountPercentage")
    @JsonAlias("discount")
    private Double discountPercentage;

    @JsonProperty("type")
    @JsonAlias("propertyType")
    @NotNull(message = "Property type is required")
    private PropertyType type;

    private PropertyCategory category;
    private String customCategory;
    private PropertyStatus status;

    // ===== PÉRIODE DE FACTURATION =====
    private BillingPeriod billingPeriod;

    // ===== CONTACT =====
    private String phoneNumber;
    private String whatsappNumber;

    // ===== FRAIS =====
    private Double additionalFees;

    // ===== PAIEMENT =====
    private PaymentMethod paymentMethod;

    // ===== PROPRIÉTAIRE =====
    private Long ownerId;
    private String ownerName;

    // ===== DATES =====
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime approvedAt;

    private String rejectionReason;

    // ===== LOCALISATION GPS =====
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    // ===== CARACTÉRISTIQUES PHYSIQUES =====
    private Double surface;
    private Integer rooms;
    private Integer bedrooms;
    private Integer bathrooms;
    private Integer floorNumber;
    private Integer totalFloors;
    private Integer buildingAge;
    private Integer constructionYear;
    private String condition; // NEW, GOOD, RENOVATED, NEEDS_REPAIR
    private Boolean furnished;

    // ===== ÉQUIPEMENTS =====
    private Boolean hasElevator;
    private Boolean hasParking;
    private Boolean hasPool;
    private Boolean hasGarden;
    private Boolean hasAirConditioning;
    private Boolean hasInternet;
    private Boolean hasSecurity;
    private Boolean hasBalcony;
    private Boolean petAllowed;

    // ===== ENVIRONNEMENT =====
    private Boolean cityCenter;
    private Boolean nearSchool;
    private Boolean nearUniversity;
    private Boolean nearMosque;
    private Boolean nearHospital;
    private Boolean nearMarket;
    private Boolean nearTram;
    private Boolean nearBus;
    private Boolean nearTrainStation;

    // ===== QUARTIER =====
    private Boolean popularArea;
    private Boolean modernArea;
    private Boolean quietArea;
    private Boolean familyArea;

    // ===== ORIENTATION ET VUES =====
    private SunDirection sunDirection;
    private Boolean gardenView;
    private Boolean streetView;
    private Boolean seaView;

    // ===== PRIX CALCULÉ =====
    private Double pricePerSquareMeter;
}
