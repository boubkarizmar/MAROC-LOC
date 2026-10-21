package com.marocloc.marocloc_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.marocloc.marocloc_backend.model.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePropertyRequest {

    // ===== INFORMATIONS DE BASE =====

    @NotBlank(message = "Le titre est requis")
    @Size(min = 5, max = 200, message = "Le titre doit contenir entre 5 et 200 caractères")
    private String title;

    @NotBlank(message = "La description est requise")
    @Size(min = 50, max = 5000, message = "La description doit contenir entre 50 et 5000 caractères")
    private String description;

    @NotNull(message = "Le prix est requis")
    @Positive(message = "Le prix doit être positif")
    @DecimalMin(value = "1000", message = "Le prix minimum est de 1000 DH")
    private BigDecimal price;

    @NotBlank(message = "La ville est requise")
    private String city;

    @NotBlank(message = "L'adresse est requise")
    private String address;

    // ===== TYPE ET CATÉGORIE =====

    @JsonAlias("propertyType")
    @NotNull(message = "Le type de transaction est requis")
    private PropertyType type;

    @NotNull(message = "La catégorie est requise")
    private PropertyCategory category;

    private String customCategory;

    // ===== PÉRIODE DE FACTURATION =====
    @Builder.Default
    private BillingPeriod billingPeriod = BillingPeriod.MONTH;

    // ===== CARACTÉRISTIQUES PHYSIQUES =====

    @NotNull(message = "La surface est requise")
    @Positive(message = "La surface doit être positive")
    @DecimalMin(value = "10", message = "La surface minimum est de 10 m²")
    private Double surface;

    @NotNull(message = "Le nombre de pièces est requis")
    @Min(value = 1, message = "Minimum 1 pièce")
    @Max(value = 20, message = "Maximum 20 pièces")
    private Integer rooms;

    @Min(value = 0, message = "Le nombre de chambres ne peut pas être négatif")
    @Max(value = 15, message = "Maximum 15 chambres")
    private Integer bedrooms;

    @Min(value = 0, message = "Le nombre de salles de bain ne peut pas être négatif")
    @Max(value = 10, message = "Maximum 10 salles de bain")
    private Integer bathrooms;

    @Min(value = 0, message = "Le numéro d'étage ne peut pas être négatif")
    @Max(value = 50, message = "Maximum 50 étages")
    private Integer floorNumber;

    @Min(value = 1, message = "Le nombre total d'étages doit être au moins 1")
    @Max(value = 50, message = "Maximum 50 étages")
    private Integer totalFloors;

    @Min(value = 0, message = "L'âge du bâtiment ne peut pas être négatif")
    @Max(value = 200, message = "Âge maximum 200 ans")
    private Integer buildingAge;

    @Min(value = 1900, message = "Année de construction invalide")
    @Max(value = 2026, message = "Année de construction invalide")
    private Integer constructionYear;

    @Pattern(regexp = "^(NEW|GOOD|RENOVATED|NEEDS_REPAIR|TO_RENOVATE)$", message = "État invalide (NEW, GOOD, RENOVATED, NEEDS_REPAIR, TO_RENOVATE)")
    private String condition;

    private Boolean furnished;

    // ===== ÉQUIPEMENTS =====
    private Boolean hasInternet;
    private Boolean hasSecurity;
    private Boolean hasElevator;
    private Boolean hasParking;
    private Boolean hasPool;
    private Boolean hasGarden;
    private Boolean hasAirConditioning;
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

    // ===== MÉDIA =====
    private String videoTour;

    // ===== PAIEMENT =====
    private PaymentMethod paymentMethod;

    // ===== LOCALISATION =====

    @NotNull(message = "La latitude est requise")
    @DecimalMin(value = "-90.0", message = "Latitude invalide")
    @DecimalMax(value = "90.0", message = "Latitude invalide")
    private Double latitude;

    @NotNull(message = "La longitude est requise")
    @DecimalMin(value = "-180.0", message = "Longitude invalide")
    @DecimalMax(value = "180.0", message = "Longitude invalide")
    private Double longitude;

    // ===== CONTACT =====

    @Pattern(regexp = "^(\\+212|0)[567][0-9]{8}$", message = "Numéro de téléphone invalide (ex: 0612345678)")
    private String phoneNumber;

    @Pattern(regexp = "^(\\+212|0)[567][0-9]{8}$", message = "Numéro WhatsApp invalide")
    private String whatsappNumber;

    // ===== FRAIS ET REMISES =====

    @DecimalMin(value = "0.0", message = "Les frais supplémentaires ne peuvent pas être négatifs")
    private Double additionalFees;

    @JsonAlias("discount")
    @DecimalMin(value = "0.0", message = "La remise ne peut pas être négative")
    @DecimalMax(value = "50.0", message = "La remise maximum est de 50%")
    private Double discountPercentage;

    // ===== IMAGES =====
    private List<String> images;

    // ===== INFORMATIONS PROPRIÉTAIRE =====

    private String firstNameArabic;

    private String lastNameArabic;

    private String firstNameLatin;

    private String lastNameLatin;

    @Pattern(regexp = "[A-Z]{1,2}\\d{5,8}", message = "CIN invalide (ex: AB123456)")
    private String cin;

    private String cinImageUrl;
}
