package com.marocloc.marocloc_backend.model;

public enum SunDirection {
    EAST("Est"),
    WEST("Ouest"),
    SOUTH("Sud"),
    NORTH("Nord");

    private final String displayName;

    SunDirection(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}