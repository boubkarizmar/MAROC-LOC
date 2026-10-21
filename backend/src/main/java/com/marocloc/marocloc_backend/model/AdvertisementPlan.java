package com.marocloc.marocloc_backend.model;

public enum AdvertisementPlan {

    BOOST_BASIC(
            "Boost Basic",
            10000L,
            1,
            5,
            false,
            false,
            false,
            false,
            30,
            "Promotion de 1 propriété, apparition mise en avant, jusqu’à 5 images, analytics basiques") ,

    BOOST_PRO(
            "Boost Pro",
            20000L,
            5,
            15,
            true,
            false,
            true,
            true,
            30,
            "Promotion jusqu’à 5 propriétés, priorité supérieure, jusqu’à 15 images + vidéo, ciblage par ville, badge Featured") ,

    PREMIUM_ADS(
            "Premium Ads",
            60000L,
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            true,
            true,
            true,
            true,
            30,
            "Propriétés illimitées, affichage homepage, priorite maximale, media multiples, ciblage avancé, analytics complètes") ;

    private final String displayName;
    private final Long amountMinorUnits;
    private final int maxProperties;
    private final int maxImages;
    private final boolean videoAllowed;
    private final boolean homepagePlacement;
    private final boolean featuredBadge;
    private final boolean supportsAdvancedTargeting;
    private final int durationDays;
    private final String description;

    AdvertisementPlan(String displayName,
                      Long amountMinorUnits,
                      int maxProperties,
                      int maxImages,
                      boolean videoAllowed,
                      boolean homepagePlacement,
                      boolean featuredBadge,
                      boolean supportsAdvancedTargeting,
                      int durationDays,
                      String description) {
        this.displayName = displayName;
        this.amountMinorUnits = amountMinorUnits;
        this.maxProperties = maxProperties;
        this.maxImages = maxImages;
        this.videoAllowed = videoAllowed;
        this.homepagePlacement = homepagePlacement;
        this.featuredBadge = featuredBadge;
        this.supportsAdvancedTargeting = supportsAdvancedTargeting;
        this.durationDays = durationDays;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Long getAmountMinorUnits() {
        return amountMinorUnits;
    }

    public int getMaxProperties() {
        return maxProperties;
    }

    public int getMaxImages() {
        return maxImages;
    }

    public boolean isVideoAllowed() {
        return videoAllowed;
    }

    public boolean isHomepagePlacement() {
        return homepagePlacement;
    }

    public boolean isFeaturedBadge() {
        return featuredBadge;
    }

    public boolean isSupportsAdvancedTargeting() {
        return supportsAdvancedTargeting;
    }

    public int getDurationDays() {
        return durationDays;
    }

    public String getDescription() {
        return description;
    }
}
