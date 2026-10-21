package com.marocloc.marocloc_backend.analytics.controller;

import com.marocloc.marocloc_backend.analytics.dto.OwnerDashboardDTO;
import com.marocloc.marocloc_backend.analytics.service.OwnerDashboardService;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/analytics/owner")
@RequiredArgsConstructor
public class OwnerDashboardController {

    private final OwnerDashboardService ownerDashboardService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<OwnerDashboardDTO> getMyDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long ownerId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new NotFoundException("User", userDetails.getUsername()))
                .getId();
        return ResponseEntity.ok(ownerDashboardService.getDashboard(ownerId));
    }
}
