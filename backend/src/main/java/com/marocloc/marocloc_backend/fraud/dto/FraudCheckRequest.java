package com.marocloc.marocloc_backend.fraud.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudCheckRequest {

    @NotNull(message = "L'ID de propriété est obligatoire")
    private Long propertyId;

    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal surface;
    private String city;
    private String propertyType;
    private List<String> imageUrls;
    private String contactPhone;
    private String contactEmail;

    @NotNull(message = "L'ID utilisateur est obligatoire")
    private Long userId;

    private String ipAddress;
    private String deviceFingerprint;
}
