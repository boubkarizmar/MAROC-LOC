package com.marocloc.marocloc_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Message entity for user-to-user communication
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_sender_receiver", columnList = "sender_id, receiver_id"),
    @Index(name = "idx_conversation", columnList = "sender_id, receiver_id, timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @NotBlank
    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "property_id")
    private Long propertyId;

    @Column(name = "timestamp", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}