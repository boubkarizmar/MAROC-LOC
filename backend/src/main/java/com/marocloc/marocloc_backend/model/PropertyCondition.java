package com.marocloc.marocloc_backend.model;

public enum PropertyCondition {
    NEW("Neuf"),
    GOOD("Bon état"),
    RENOVATED("Rénové"),
    NEEDS_REPAIR("À rénover"),
    TO_RENOVATE("À rénover");

    private final String displayName;

    PropertyCondition(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}