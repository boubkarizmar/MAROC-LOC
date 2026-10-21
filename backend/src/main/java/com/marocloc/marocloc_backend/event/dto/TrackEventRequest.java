package com.marocloc.marocloc_backend.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackEventRequest {

    @NotBlank(message = "Le type d'événement est obligatoire")
    @Pattern(regexp = "^[a-z]+\\.[a-z_]+$", message = "Format invalide. Ex: property.view")
    private String eventType;

    private Integer eventVersion;

    private String sessionId;

    private String deviceFingerprint;

    private Instant clientTimestamp;

    private String source;

    private EventPayload payload;
}
