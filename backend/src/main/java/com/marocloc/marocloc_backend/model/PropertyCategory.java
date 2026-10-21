package com.marocloc.marocloc_backend.model;

/**
 * Property Category Enum
 * Represents different types of properties available on the platform
 */
public enum PropertyCategory {
    CAFE("Cafe"),
    GYM("Gym"),
    SHOP("Shop"),
    OFFICE("Office"),
    HOUSE("House"),
    APARTMENT("Apartment"),
    OTHER("Other");

    private final String displayName;

    PropertyCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get all category options excluding OTHER
     */
    public static PropertyCategory[] getStaticCategories() {
        return new PropertyCategory[]{
                CAFE, GYM, SHOP, OFFICE, HOUSE, APARTMENT
        };
    }

    /**
     * Check if category is static (not OTHER)
     */
    public boolean isStatic() {
        return this != OTHER;
    }
}
