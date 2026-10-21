package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.ADMIN + "/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> updateSettings(
            @RequestBody Map<String, String> settings,
            @AuthenticationPrincipal UserDetails userDetails) {
        settingsService.updateSettings(settings, userDetails.getUsername());
        return ResponseEntity.ok(settingsService.getAllSettings());
    }
}
