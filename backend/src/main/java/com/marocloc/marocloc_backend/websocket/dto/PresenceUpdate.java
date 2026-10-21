package com.marocloc.marocloc_backend.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceUpdate {

    public enum Status {
        ONLINE, AWAY, OFFLINE
    }

    private Long userId;
    private Status status;
    private Instant lastSeen;
    private String deviceType;
}
