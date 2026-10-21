package com.marocloc.marocloc_backend.model;

public enum BillingPeriod {
    MONTH("Mensuel"),
    DAY("Journalier"),
    TOTAL("Total");

    private final String displayName;

    BillingPeriod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}