package com.marocloc.marocloc_backend.model;

public enum PaymentMethod {
    CMI,
    BANK_TRANSFER,
    CASH,
    OTHER;

    // Pour garder la compatibilité avec l'ancien code
    public static final String CMI_STRING = "CMI";
    public static final String BANK_TRANSFER_STRING = "BANK_TRANSFER";
    public static final String CASH_STRING = "CASH";
    public static final String OTHER_STRING = "OTHER";
}