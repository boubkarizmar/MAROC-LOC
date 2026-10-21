package com.marocloc.marocloc_backend.model;
public enum PropertyStatus {
    PENDING,          // En attente de validation
    APPROVED,         // Approuvé
    AVAILABLE,        // Disponible
    REJECTED,         // Rejeté
    RESERVED,         // Réservé
    RENTED,           // Loué
    PENDING_PAYMENT,  // Paiement en cours (saga)
    SOLD;             // Vendu

    public boolean isActive() {
        return this == APPROVED || this == AVAILABLE;
    }

    public boolean isAvailableForTransaction() {
        return this == APPROVED || this == AVAILABLE;
    }
}