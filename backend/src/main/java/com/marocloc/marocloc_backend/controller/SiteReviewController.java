package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.CreateSiteReviewRequest;
import com.marocloc.marocloc_backend.dto.SiteReviewDTO;
import com.marocloc.marocloc_backend.service.SiteReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(ApiRoutes.REVIEWS_V1 + "/site")
@RequiredArgsConstructor
public class SiteReviewController {

    private final SiteReviewService siteReviewService;

    @PostMapping
    public ResponseEntity<SiteReviewDTO> create(@Valid @RequestBody CreateSiteReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteReviewService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<SiteReviewDTO>> getApproved() {
        return ResponseEntity.ok(siteReviewService.findApproved());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(siteReviewService.getStats());
    }
}
