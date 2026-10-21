package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Favorite controller with role-based access
 * Only LOCATAIRE and ADMIN can manage favorites
 */
@RestController
@RequestMapping(ApiRoutes.FAVORITES)
@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
// @PreAuthorize("hasAnyRole('LOCATAIRE', 'ADMIN')")
@PreAuthorize("isAuthenticated()")
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * Add property to favorites
     */
    @PostMapping("/{propertyId}")
    public ResponseEntity<Void> addFavorite(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {

        favoriteService.addFavorite(userDetails.getUsername(), propertyId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Remove property from favorites
     */
    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {

        favoriteService.removeFavorite(userDetails.getUsername(), propertyId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get current user's favorites
     */
    @GetMapping
    public ResponseEntity<List<PropertyDTO>> getMyFavorites(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                favoriteService.getUserFavorites(userDetails.getUsername())
        );
    }

    /**
     * Check if property is favorite
     */
    @GetMapping("/check/{propertyId}")
    public ResponseEntity<Boolean> isFavorite(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean isFav = favoriteService.isFavorite(
                userDetails.getUsername(),
                propertyId
        );

        return ResponseEntity.ok(isFav);
    }
}
