package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.OwnerRatingDTO;
import com.marocloc.marocloc_backend.model.OwnerRating;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.OwnerRatingRepository;
import com.marocloc.marocloc_backend.repository.ReviewRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OwnerRatingServiceImplTest {

    @Mock private OwnerRatingRepository ownerRatingRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReviewRepository reviewRepository;

    @InjectMocks
    private OwnerRatingServiceImpl ownerRatingService;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Test Owner")
                .email("owner@example.com")
                .role(Role.PROPRIETAIRE)
                .build();
    }

    @Test
    void recalculateOwnerRating_shouldUseOwnerIdForAverageRating() {
        // This test verifies the bug fix: previously getAverageRatingByPropertyId(userId)
        // was incorrectly called. Now it should call getAverageRatingByOwnerId(userId).
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(reviewRepository.getAverageRatingByOwnerId(1L)).thenReturn(4.5);
        when(reviewRepository.countByOwnerIdAndStatusApproved(1L)).thenReturn(10L);
        when(ownerRatingRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(ownerRatingRepository.save(any(OwnerRating.class))).thenAnswer(inv -> inv.getArgument(0));

        ownerRatingService.recalculateOwnerRating(1L);

        verify(reviewRepository).getAverageRatingByOwnerId(1L);
        verify(reviewRepository).countByOwnerIdAndStatusApproved(1L);
        verify(ownerRatingRepository).save(any(OwnerRating.class));
    }

    @Test
    void recalculateOwnerRating_shouldSkipNonProprietaire() {
        owner.setRole(Role.LOCATAIRE);
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));

        ownerRatingService.recalculateOwnerRating(1L);

        verify(reviewRepository, never()).getAverageRatingByOwnerId(any());
        verify(ownerRatingRepository, never()).save(any());
    }

    @Test
    void getOwnerRating_shouldReturnExistingOrRecalculate() {
        OwnerRating rating = OwnerRating.builder()
                .user(owner)
                .overallScore(85.0)
                .build();
        when(ownerRatingRepository.findByUserId(1L)).thenReturn(Optional.of(rating));

        OwnerRatingDTO dto = ownerRatingService.getOwnerRating(1L);

        assertThat(dto.getOverallScore()).isEqualTo(85.0);
        assertThat(dto.getUserName()).isEqualTo("Test Owner");
    }
}
