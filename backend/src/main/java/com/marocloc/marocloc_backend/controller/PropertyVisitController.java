package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.dto.PropertyVisitDTO;
import com.marocloc.marocloc_backend.dto.ScheduleVisitRequest;
import com.marocloc.marocloc_backend.service.PropertyVisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiRoutes.V1 + "/visits")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PropertyVisitController {

    private final PropertyVisitService visitService;

    @PostMapping
    public ResponseEntity<ApiResponse<PropertyVisitDTO>> scheduleVisit(
            @Valid @RequestBody ScheduleVisitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<PropertyVisitDTO> response = visitService.scheduleVisit(request, userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/my-visits")
    public ResponseEntity<ApiResponse<List<PropertyVisitDTO>>> getMyVisits(
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<List<PropertyVisitDTO>> response = visitService.getMyVisits(userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/owner-visits")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ApiResponse<List<PropertyVisitDTO>>> getOwnerVisits(
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<List<PropertyVisitDTO>> response = visitService.getVisitsForOwner(userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PropertyVisitDTO>>> getVisitsByProperty(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<List<PropertyVisitDTO>> response = visitService.getVisitsByProperty(propertyId, userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @PutMapping("/{visitId}/status")
    public ResponseEntity<ApiResponse<PropertyVisitDTO>> updateStatus(
            @PathVariable Long visitId,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<PropertyVisitDTO> response = visitService.updateVisitStatus(visitId, status, userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @PutMapping("/{visitId}/confirm")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ApiResponse<PropertyVisitDTO>> confirmVisit(
            @PathVariable Long visitId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<PropertyVisitDTO> response = visitService.updateVisitStatus(visitId, "CONFIRMED", userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @PutMapping("/{visitId}/reject")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<ApiResponse<PropertyVisitDTO>> rejectVisit(
            @PathVariable Long visitId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<PropertyVisitDTO> response = visitService.rejectVisit(visitId, reason, userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @DeleteMapping("/{visitId}")
    public ResponseEntity<ApiResponse<Void>> cancelVisit(
            @PathVariable Long visitId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ApiResponse<Void> response = visitService.cancelVisit(visitId, userDetails.getUsername());
        return ResponseEntity.status(response.getCode()).body(response);
    }
}
