package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.AdvertisementAnalyticsDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementDTO;
import com.marocloc.marocloc_backend.dto.AdvertisementMetricsRequest;
import com.marocloc.marocloc_backend.dto.AdvertisementRequest;

import java.util.List;

public interface AdvertisementService {

    List<AdvertisementDTO> getActiveAds();

    List<AdvertisementDTO> getActiveAdsByStatus();

    List<AdvertisementDTO> getAllAds();

    List<AdvertisementDTO> getRotatedAds(String slot, int limit);

    AdvertisementDTO createAd(AdvertisementRequest request);

    AdvertisementDTO updateAd(Long id, AdvertisementRequest request);

    void deleteAd(Long id);

    AdvertisementDTO submitAdRequest(AdvertisementRequest request, String username);

    List<AdvertisementDTO> getUserAds(String username);

    List<AdvertisementDTO> getPendingRequests();

    AdvertisementDTO approveAdRequest(Long id, String adminComment);

    AdvertisementDTO rejectAdRequest(Long id, String adminComment);

    AdvertisementAnalyticsDTO getAdAnalytics(Long id);

    AdvertisementDTO updateAdMetrics(AdvertisementMetricsRequest request);

    AdvertisementDTO previewAd(AdvertisementRequest request);
}
