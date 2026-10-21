package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Entity
@Table(name = "property", indexes = {
    // Index existants
    @Index(name = "idx_property_location", columnList = "location"),
    @Index(name = "idx_property_city_price", columnList = "city, price"),
    @Index(name = "idx_property_status_type", columnList = "status, type"),
    @Index(name = "idx_property_owner_active", columnList = "owner_id, status"),
    @Index(name = "idx_property_created_at", columnList = "created_at"),
    @Index(name = "idx_property_price_range", columnList = "price, city, type"),

    // Index pour les caractéristiques
    @Index(name = "idx_property_surface", columnList = "surface"),
    @Index(name = "idx_property_rooms", columnList = "rooms"),
    @Index(name = "idx_property_price_surface", columnList = "price, surface"),

    // Index pour les recherches par ville
    @Index(name = "idx_property_city", columnList = "city"),

    // Index composite ville + statut
    @Index(name = "idx_property_city_status", columnList = "city, status"),

    // Index pour les équipements
    @Index(name = "idx_property_parking", columnList = "has_parking"),
    @Index(name = "idx_property_pool", columnList = "has_pool"),
    @Index(name = "idx_property_furnished", columnList = "furnished"),

    // ⭐ NOUVEAUX INDEX
    @Index(name = "idx_property_floor", columnList = "floor_number"),
    @Index(name = "idx_property_building_age", columnList = "building_age"),
    @Index(name = "idx_property_near_school", columnList = "near_school"),
    @Index(name = "idx_property_near_mosque", columnList = "near_mosque"),
    @Index(name = "idx_property_city_center", columnList = "city_center"),
    @Index(name = "idx_property_sun_direction", columnList = "sun_direction"),
    @Index(name = "idx_property_payment_method", columnList = "payment_method")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    // ===== INFORMATIONS DE BASE =====

    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 255)
    private String title;

    @NotBlank(message = "Description is required")
    @Column(columnDefinition = "TEXT", nullable = false)
    @Size(min = 50, max = 5000, message = "Description must be between 50 and 5000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal price;

    @NotBlank(message = "City is required")
    @Column(nullable = false, length = 100)
    private String city;

    @NotBlank(message = "Address is required")
    @Column(nullable = false, length = 255)
    private String address;

    // ===== TYPE ET CATÉGORIE =====

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PropertyType type = PropertyType.RENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PropertyCategory category;

    @Column(name = "custom_category", length = 255)
    private String customCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.PENDING;

    // ===== PÉRIODE DE FACTURATION =====

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", length = 10)
    @Builder.Default
    private BillingPeriod billingPeriod = BillingPeriod.MONTH;

    // ===== CARACTÉRISTIQUES PHYSIQUES =====

    @NotNull(message = "Surface is required")
    @Positive(message = "Surface must be positive")
    @Column(nullable = false)
    private Double surface;

    @NotNull(message = "Number of rooms is required")
    @Min(value = 1, message = "Minimum 1 room")
    @Max(value = 20, message = "Maximum 20 rooms")
    @Column(nullable = false)
    private Integer rooms;

    @Min(value = 0, message = "Bedrooms cannot be negative")
    @Max(value = 15, message = "Maximum 15 bedrooms")
    private Integer bedrooms;

    @Min(value = 0, message = "Bathrooms cannot be negative")
    @Max(value = 10, message = "Maximum 10 bathrooms")
    private Integer bathrooms;

    @Column(name = "floor_number")
    @Min(value = 0, message = "Floor number cannot be negative")
    @Max(value = 50, message = "Maximum floor 50")
    private Integer floorNumber;

    @Column(name = "total_floors")
    @Min(value = 1, message = "Total floors must be at least 1")
    @Max(value = 50, message = "Maximum total floors 50")
    private Integer totalFloors;

    @Column(name = "building_age")
    @Min(value = 0, message = "Building age cannot be negative")
    @Max(value = 200, message = "Maximum building age 200 years")
    private Integer buildingAge;

    @Min(value = 1900, message = "Invalid construction year")
    @Max(value = 2026, message = "Invalid construction year")
    private Integer constructionYear;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PropertyCondition condition;

    private Boolean furnished;

    // ===== ÉQUIPEMENTS =====

    @Column(name = "has_elevator")
    private Boolean hasElevator;

    @Column(name = "has_parking")
    private Boolean hasParking;

    @Column(name = "has_pool")
    private Boolean hasPool;

    @Column(name = "has_garden")
    private Boolean hasGarden;

    @Column(name = "has_air_conditioning")
    private Boolean hasAirConditioning;

    @Column(name = "has_internet")
    private Boolean hasInternet;

    @Column(name = "has_security")
    private Boolean hasSecurity;

    @Column(name = "has_balcony")
    private Boolean hasBalcony;

    @Column(name = "pet_allowed")
    private Boolean petAllowed;

    // ===== ENVIRONNEMENT =====

    @Column(name = "city_center")
    private Boolean cityCenter;

    @Column(name = "near_school")
    private Boolean nearSchool;

    @Column(name = "near_university")
    private Boolean nearUniversity;

    @Column(name = "near_mosque")
    private Boolean nearMosque;

    @Column(name = "near_hospital")
    private Boolean nearHospital;

    @Column(name = "near_market")
    private Boolean nearMarket;

    @Column(name = "near_tram")
    private Boolean nearTram;

    @Column(name = "near_bus")
    private Boolean nearBus;

    @Column(name = "near_train_station")
    private Boolean nearTrainStation;

    // ===== QUARTIER =====

    @Column(name = "popular_area")
    private Boolean popularArea;

    @Column(name = "modern_area")
    private Boolean modernArea;

    @Column(name = "quiet_area")
    private Boolean quietArea;

    @Column(name = "family_area")
    private Boolean familyArea;

    // ===== ORIENTATION ET VUES =====

    @Enumerated(EnumType.STRING)
    @Column(name = "sun_direction", length = 10)
    private SunDirection sunDirection;

    @Column(name = "garden_view")
    private Boolean gardenView;

    @Column(name = "street_view")
    private Boolean streetView;

    @Column(name = "sea_view")
    private Boolean seaView;

    // ===== MÉDIA =====

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(name = "video_tour", length = 500)
    private String videoTour;

    // ===== PAIEMENT =====

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    // ===== LOCALISATION GÉOGRAPHIQUE =====

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    @Column(nullable = false)
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    @Column(nullable = false)
    private Double longitude;

    // ===== PROPRIÉTAIRE =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "fk_property_owner"))
    private User owner;

    // ===== CONTACT =====

    @Column(name = "phone_number", length = 20)
    @Pattern(regexp = "^(\\+212|0)[567][0-9]{8}$", message = "Invalid phone number")
    private String phoneNumber;

    @Column(name = "whatsapp_number", length = 20)
    @Pattern(regexp = "^(\\+212|0)[567][0-9]{8}$", message = "Invalid WhatsApp number")
    private String whatsappNumber;

    // ===== FRAIS ET REMISES =====

    @Column(name = "additional_fees", nullable = false)
    @Builder.Default
    @DecimalMin(value = "0.0", message = "Fees must be >= 0")
    private Double additionalFees = 0.0;

    @Column(name = "discount_percentage", nullable = false)
    @Builder.Default
    @DecimalMin(value = "0.0", message = "Discount must be >= 0")
    @DecimalMax(value = "50.0", message = "Discount must be <= 50")
    private Double discountPercentage = 0.0;

    // ===== DATES =====

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    // ===== VALIDATION =====

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    // ===== STATISTIQUES =====

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "search_vector", insertable = false, updatable = false)
    private String searchVector;

    // ===== MÉTHODES UTILITAIRES =====

    @PrePersist
    @PreUpdate
    public void updateLocationFromCoordinates() {
        if (latitude != null && longitude != null) {
            try {
                org.locationtech.jts.geom.GeometryFactory geometryFactory = new org.locationtech.jts.geom.GeometryFactory();
                org.locationtech.jts.geom.Point point = geometryFactory.createPoint(
                    new org.locationtech.jts.geom.Coordinate(longitude, latitude)
                );
                point.setSRID(4326);
                this.location = point;
            } catch (Exception e) {
                // Log and continue if geometry creation fails
                log.error("Failed to create PostGIS point for property: {}", e.getMessage());
            }
        }
        this.updatedAt = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getFinalPrice() {
        if (price == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal discountAmount = getDiscountAmount();
        BigDecimal fees = additionalFees != null ? BigDecimal.valueOf(additionalFees) : BigDecimal.ZERO;
        return price.add(fees).subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public BigDecimal getDiscountAmount() {
        if (price == null || discountPercentage == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal discountRate = BigDecimal.valueOf(discountPercentage).divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        return price.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public boolean isAvailable() {
        return status == PropertyStatus.APPROVED || status == PropertyStatus.AVAILABLE;
    }

    @Transient
    public Double getPricePerSquareMeter() {
        if (price == null || surface == null || surface <= 0) {
            return null;
        }
        return price.doubleValue() / surface;
    }

    public void incrementViewCount() {
        this.viewCount = (viewCount != null ? viewCount : 0L) + 1;
    }

    @Transient
    public String getLocationString() {
        return city + ", " + address;
    }

    // ⭐ Méthodes utilitaires pour le typage boolean
    public boolean isCityCenter() { return cityCenter != null && cityCenter; }
    public boolean isNearSchool() { return nearSchool != null && nearSchool; }
    public boolean isNearUniversity() { return nearUniversity != null && nearUniversity; }
    public boolean isNearMosque() { return nearMosque != null && nearMosque; }
    public boolean isNearHospital() { return nearHospital != null && nearHospital; }
    public boolean isNearMarket() { return nearMarket != null && nearMarket; }
    public boolean isNearTram() { return nearTram != null && nearTram; }
    public boolean isNearBus() { return nearBus != null && nearBus; }
    public boolean isNearTrainStation() { return nearTrainStation != null && nearTrainStation; }
    public boolean isPopularArea() { return popularArea != null && popularArea; }
    public boolean isModernArea() { return modernArea != null && modernArea; }
    public boolean isQuietArea() { return quietArea != null && quietArea; }
    public boolean isFamilyArea() { return familyArea != null && familyArea; }
    public boolean isGardenView() { return gardenView != null && gardenView; }
    public boolean isStreetView() { return streetView != null && streetView; }
    public boolean isSeaView() { return seaView != null && seaView; }
}
