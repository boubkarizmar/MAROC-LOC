package com.marocloc.marocloc_backend.event.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_log", indexes = {
    @Index(name = "idx_event_type_time", columnList = "eventType,serverTimestamp DESC"),
    @Index(name = "idx_event_user_time", columnList = "userId,serverTimestamp DESC"),
    @Index(name = "idx_event_session", columnList = "sessionId,serverTimestamp DESC"),
    @Index(name = "idx_event_unprocessed", columnList = "processed")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID eventId = UUID.randomUUID();

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "event_version")
    @Builder.Default
    private Integer eventVersion = 1;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "session_id", length = 128)
    private String sessionId;

    @Column(name = "device_fingerprint", length = 64)
    private String deviceFingerprint;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "os", length = 30)
    private String os;

    @Column(name = "browser", length = 30)
    private String browser;

    @Column(name = "country", length = 2)
    @Builder.Default
    private String country = "MA";

    @Column(name = "city", length = 100)
    private String city;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private String payload;

    @Column(name = "client_timestamp")
    private Instant clientTimestamp;

    @Column(name = "server_timestamp", nullable = false, updatable = false)
    @Builder.Default
    private Instant serverTimestamp = Instant.now();

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "source", length = 20)
    @Builder.Default
    private String source = "web";

    @Column(name = "processed")
    @Builder.Default
    private Boolean processed = false;
}
