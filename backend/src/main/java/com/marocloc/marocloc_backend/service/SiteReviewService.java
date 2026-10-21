package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CreateSiteReviewRequest;
import com.marocloc.marocloc_backend.dto.SiteReviewDTO;

import java.util.List;
import java.util.Map;

public interface SiteReviewService {
    SiteReviewDTO create(CreateSiteReviewRequest request);
    List<SiteReviewDTO> findApproved();
    Map<String, Object> getStats();
}
