package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Property Service Implementation Tests")
class PropertyServiceImplTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private FileValidationService fileValidationService;

    @InjectMocks
    private PropertyServiceImpl propertyService;

    @Test
    @DisplayName("Should compute statistics using aggregation queries")
    void shouldComputeStatisticsUsingAggregationQueries() {
        when(propertyRepository.count()).thenReturn(100L);
        when(propertyRepository.countByStatus(PropertyStatus.PENDING)).thenReturn(5L);
        when(propertyRepository.countByStatus(PropertyStatus.APPROVED)).thenReturn(80L);
        when(propertyRepository.countByStatus(PropertyStatus.REJECTED)).thenReturn(3L);
        when(propertyRepository.getPriceStatisticsByStatus(PropertyStatus.APPROVED))
                .thenReturn(new Object[]{new BigDecimal("500000"), new BigDecimal("100000"), new BigDecimal("2000000")});
        when(propertyRepository.findDistinctCitiesByStatus(anyList())).thenReturn(List.of("Casablanca", "Rabat"));
        when(propertyRepository.sumViewCount()).thenReturn(15000L);
        when(propertyRepository.countCreatedSince(any(LocalDateTime.class))).thenReturn(12L);
        when(propertyRepository.averageDiscountPercentage()).thenReturn(5.5);
        when(propertyRepository.getCityAggregation()).thenReturn(List.of(
                new Object[]{"Casablanca", 50L, 600000.0, 8000L},
                new Object[]{"Rabat", 30L, 450000.0, 5000L}
        ));

        var stats = propertyService.getPropertyStatistics();

        assertThat(stats.getTotalProperties()).isEqualTo(100L);
        assertThat(stats.getPendingProperties()).isEqualTo(5L);
        assertThat(stats.getApprovedProperties()).isEqualTo(80L);
        assertThat(stats.getRejectedProperties()).isEqualTo(3L);
        assertThat(stats.getTotalViews()).isEqualTo(15000L);
        assertThat(stats.getPropertiesThisMonth()).isEqualTo(12L);
        assertThat(stats.getAverageDiscountPercentage()).isEqualTo(5.5);
        assertThat(stats.getCityStats()).hasSize(2);

        // Critical: verify findAll() was NEVER called
        verify(propertyRepository, never()).findAll();
    }
}
