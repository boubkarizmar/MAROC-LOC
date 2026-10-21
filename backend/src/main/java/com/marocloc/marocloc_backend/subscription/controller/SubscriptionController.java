package com.marocloc.marocloc_backend.subscription.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.subscription.dto.FeatureUsageResponse;
import com.marocloc.marocloc_backend.subscription.dto.SubscriptionTierResponse;
import com.marocloc.marocloc_backend.subscription.service.SubscriptionEnforcementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping(ApiRoutes.SUBSCRIPTION)
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionEnforcementService subscriptionEnforcementService;

    @GetMapping("/tiers")
    public ResponseEntity<ApiResponse<List<SubscriptionTierResponse>>> getTiers() {
        List<SubscriptionTierResponse> tiers = List.of(
                SubscriptionTierResponse.builder()
                        .tier("FREE")
                        .name("Gratuit")
                        .description("Parfait pour débuter")
                        .monthlyPrice(BigDecimal.ZERO)
                        .yearlyPrice(BigDecimal.ZERO)
                        .features(List.of(
                                "1 annonce active",
                                "5 messages IA/jour",
                                "5 photos/annonce",
                                "Support e-mail"
                        ))
                        .limits(List.of(
                                "Boosts non inclus",
                                "Analytiques basiques"
                        ))
                        .current(false)
                        .build(),
                SubscriptionTierResponse.builder()
                        .tier("PREMIUM")
                        .name("Premium")
                        .description("Pour les propriétaires actifs")
                        .monthlyPrice(new BigDecimal("99"))
                        .yearlyPrice(new BigDecimal("990"))
                        .features(List.of(
                                "10 annonces actives",
                                "Messages IA illimités",
                                "15 photos/annonce",
                                "2 boosts/mois",
                                "Support WhatsApp",
                                "Analytiques complètes"
                        ))
                        .limits(List.of(
                                "API en lecture seule"
                        ))
                        .current(false)
                        .build(),
                SubscriptionTierResponse.builder()
                        .tier("FEATURED")
                        .name("En Vedette")
                        .description("Pour les agences immobilières")
                        .monthlyPrice(new BigDecimal("299"))
                        .yearlyPrice(new BigDecimal("2990"))
                        .features(List.of(
                                "Annonces illimitées",
                                "Messages IA + Voix",
                                "50 photos/annonce",
                                "10 boosts/mois",
                                "Badge \"En Vedette\"",
                                "Support dédié",
                                "API complète",
                                "Analytiques concurrentielles"
                        ))
                        .limits(List.of())
                        .current(false)
                        .build()
        );
        return ResponseEntity.ok(ApiResponse.success(tiers, "Offres d'abonnement"));
    }

    @GetMapping("/usage")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FeatureUsageResponse>>> getMyUsage(
            @AuthenticationPrincipal UserDetails userDetails) {
        // In production: fetch user's actual tier from DB
        Long userId = Long.parseLong(userDetails.getUsername());
        String tier = "PREMIUM"; // placeholder
        return ResponseEntity.ok(ApiResponse.success(
                subscriptionEnforcementService.getUsageForUser(userId, tier)));
    }
}
