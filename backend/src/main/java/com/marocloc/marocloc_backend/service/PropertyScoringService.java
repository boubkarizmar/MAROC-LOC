package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.PropertyRankedDTO;

import java.util.List;

public interface PropertyScoringService {
    List<PropertyRankedDTO> getTopRankedProperties(int limit);
}
