package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.AnimatedStatsDTO;
import com.marocloc.marocloc_backend.dto.PlatformStatsDTO;
import com.marocloc.marocloc_backend.service.PlatformStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiRoutes.V1 + "/platform")
@RequiredArgsConstructor
public class PlatformController {

    private final PlatformStatsService platformStatsService;

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsDTO> getPlatformStats() {
        return ResponseEntity.ok(platformStatsService.getPlatformStats());
    }

    @GetMapping("/stats/animated")
    public ResponseEntity<AnimatedStatsDTO> getAnimatedStats() {
        return ResponseEntity.ok(platformStatsService.getAnimatedStats());
    }
}
