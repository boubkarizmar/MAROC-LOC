package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.CreateSiteReviewRequest;
import com.marocloc.marocloc_backend.dto.SiteReviewDTO;
import com.marocloc.marocloc_backend.model.ReviewStatus;
import com.marocloc.marocloc_backend.model.SiteReview;
import com.marocloc.marocloc_backend.repository.SiteReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteReviewServiceImpl implements SiteReviewService {

    private final SiteReviewRepository siteReviewRepository;

    @Override
    @Transactional
    public SiteReviewDTO create(CreateSiteReviewRequest request) {
        SiteReview review = SiteReview.builder()
                .rating(request.getRating())
                .comment(request.getComment())
                .userName(request.getUserName())
                .userEmail(request.getUserEmail())
                .status(ReviewStatus.APPROVED)
                .build();
        SiteReview saved = siteReviewRepository.save(review);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteReviewDTO> findApproved() {
        return siteReviewRepository.findByStatusOrderByCreatedAtDesc(ReviewStatus.APPROVED)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Double avg = siteReviewRepository.getAverageRating();
        long total = siteReviewRepository.countByStatus(ReviewStatus.APPROVED);
        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", avg != null ? avg : 0.0);
        stats.put("totalReviews", total);
        return stats;
    }

    private SiteReviewDTO mapToDTO(SiteReview r) {
        return SiteReviewDTO.builder()
                .id(r.getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .userName(r.getUserName())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
