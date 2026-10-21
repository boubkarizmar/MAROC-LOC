package com.marocloc.marocloc_backend.analytics.controller;

import com.marocloc.marocloc_backend.analytics.dto.HeatmapDTO;
import com.marocloc.marocloc_backend.analytics.service.HeatmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/analytics/heatmap")
@RequiredArgsConstructor
public class HeatmapController {

    private final HeatmapService heatmapService;

    @GetMapping("/density")
    public ResponseEntity<List<HeatmapDTO>> getPropertyDensityHeatmap() {
        return ResponseEntity.ok(heatmapService.getPropertyDensityHeatmap());
    }

    @GetMapping("/price")
    public ResponseEntity<List<HeatmapDTO>> getPriceHeatmap() {
        return ResponseEntity.ok(heatmapService.getPriceHeatmap());
    }

    @GetMapping("/views")
    public ResponseEntity<List<HeatmapDTO>> getViewHeatmap() {
        return ResponseEntity.ok(heatmapService.getViewHeatmap());
    }
}
