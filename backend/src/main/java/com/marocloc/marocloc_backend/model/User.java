package com.marocloc.marocloc_backend.model;

import com.marocloc.marocloc_backend.security.StringEncryptor;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * User entity representing both tenants (Locataire) and property owners (Propriétaire)
 * Also includes Admin role for platform management
 * Enhanced with verification fields for trust system
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // One user (propriétaire) can have many properties
    @OneToMany(mappedBy = "owner", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @Builder.Default
    private List<Property> properties = new ArrayList<>();

    // User Preferences
    @Column(name = "preferred_city")
    private String preferredCity;

    @Column(name = "min_budget")
    private Double minBudget;

    @Column(name = "max_budget")
    private Double maxBudget;

    // ========================
    // VERIFICATION & TRUST FIELDS
    // ========================

    @Column(name = "first_name_arabic")
    private String firstNameArabic;

    @Column(name = "last_name_arabic")
    private String lastNameArabic;

    @Column(name = "first_name_latin")
    private String firstNameLatin;

    @Column(name = "last_name_latin")
    private String lastNameLatin;

    @Column(name = "full_name")
    private String fullName;

    @Pattern(
        regexp = "(?:\\+212\\d{9}|0[6-7]\\d{8})",
        message = "Invalid Moroccan phone format. Use +2126XXXXXXXX or 06XXXXXXXX"
    )
    @Column(name = "phone_number", unique = true)
    @Convert(converter = StringEncryptor.class)
    private String phoneNumber;

    @Pattern(
        regexp = "[A-Z]{1,2}\\d{5,8}",
        message = "Invalid CIN format. Use pattern: AB123456"
    )
    @Column(name = "cin", unique = true)
    @Convert(converter = StringEncryptor.class)
    private String cin;

    @Column(name = "cin_image_url")
    private String cinImageUrl;

    @Column(name = "city")
    private String city;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_banned", nullable = false)
    @Builder.Default
    private Boolean isBanned = false;

    @Column(name = "banned_at")
    private LocalDateTime bannedAt;

    @Column(name = "ban_reason")
    private String banReason;

    @Column(name = "avatar")
    private String avatar;
}
