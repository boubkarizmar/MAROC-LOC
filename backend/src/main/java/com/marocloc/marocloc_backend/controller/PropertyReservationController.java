package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.dto.PropertyReservationDTO;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyReservation;
import com.marocloc.marocloc_backend.model.PropertyReservationStatus;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.PropertyReservationRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.EmailService;
import com.marocloc.marocloc_backend.saga.core.SagaOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(ApiRoutes.V1 + "/reservations")
@RequiredArgsConstructor
public class PropertyReservationController {

    private final PropertyReservationRepository propertyReservationRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final SagaOrchestrator sagaOrchestrator;
    private final EmailService emailService;

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PropertyReservationDTO>>> getMyReservations(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        List<PropertyReservationDTO> reservations = propertyReservationRepository.findByBuyerIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(PropertyReservationDTO::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }

    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PropertyReservationDTO>>> getReservationsByProperty(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));
        if (!user.getId().equals(property.getOwner().getId()) && !isAdmin(userDetails)) {
            throw new IllegalArgumentException("Only the property owner or admin can view these reservations");
        }
        List<PropertyReservationDTO> reservations = propertyReservationRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId).stream()
                .map(PropertyReservationDTO::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('LOCATAIRE', 'PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> cancelReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        PropertyReservation reservation = propertyReservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + id));

        if (!user.getId().equals(reservation.getBuyer().getId())
                && !user.getId().equals(reservation.getSeller().getId())
                && !isAdmin(userDetails)) {
            throw new IllegalArgumentException("Only the buyer, seller or admin can cancel a reservation");
        }

        if (reservation.getStatus() == PropertyReservationStatus.COMPLETED
                || reservation.getStatus() == PropertyReservationStatus.CANCELLED
                || reservation.getStatus() == PropertyReservationStatus.EXPIRED) {
            throw new IllegalStateException("Reservation cannot be cancelled in status: " + reservation.getStatus());
        }

        reservation.setStatus(PropertyReservationStatus.CANCELLED);
        propertyReservationRepository.save(reservation);

        Property property = reservation.getProperty();
        if (property.getStatus() == PropertyStatus.PENDING_PAYMENT
                || property.getStatus() == PropertyStatus.RESERVED) {
            property.setStatus(PropertyStatus.AVAILABLE);
            propertyRepository.save(property);
        }

        // Best-effort saga compensation if a saga exists
        if (reservation.getSagaCorrelationId() != null) {
            try {
                sagaOrchestrator.advance(reservation.getSagaCorrelationId(), "PAYMENT_FAILURE",
                        java.util.Map.of("eventResult", "FAILURE", "failureReason", "Cancelled by user"));
            } catch (Exception e) {
                log.warn("Could not advance saga for cancellation: {}", e.getMessage());
            }
        }

        emailService.sendReservationFailureEmail(
                reservation.getBuyer().getEmail(),
                property.getTitle(),
                "Annulée par l'utilisateur",
                reservation.getTransactionType().name()
        );

        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled"));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userDetails.getUsername()));
    }

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
