package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.OwnerRatingDTO;

public interface OwnerRatingService {

    OwnerRatingDTO getOwnerRating(Long userId);

    void recalculateOwnerRating(Long userId);
}
