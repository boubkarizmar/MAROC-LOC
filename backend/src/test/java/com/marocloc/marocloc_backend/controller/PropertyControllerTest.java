package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.service.FileStorageService;
import com.marocloc.marocloc_backend.service.PropertyService;
import com.marocloc.marocloc_backend.service.PropertyStatistics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.marocloc.marocloc_backend.AbstractIntegrationTest;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Property Controller Tests")
class PropertyControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PropertyService propertyService;

    @MockBean
    private FileStorageService fileStorageService;

    @Test
    @DisplayName("Should allow public GET access to all properties")
    void shouldAllowPublicGetAccess() throws Exception {
        Page<PropertyDTO> page = new PageImpl<>(List.of(
                PropertyDTO.builder().id(1L).title("Test Property").city("Casablanca").build()
        ), PageRequest.of(0, 20), 1);

        when(propertyService.getAllProperties(any())).thenReturn(page);

        mockMvc.perform(get("/api/v2/properties").contextPath("/api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Test Property"));
    }

    @Test
    @DisplayName("Should allow public GET access to property by ID")
    void shouldAllowPublicGetById() throws Exception {
        when(propertyService.getPropertyById(1L)).thenReturn(
                PropertyDTO.builder().id(1L).title("Test").city("Rabat").price(new BigDecimal("500000")).build()
        );

        mockMvc.perform(get("/api/v2/properties/1").contextPath("/api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Rabat"));
    }

    @Test
    @DisplayName("Should reject property creation without PROPRIETAIRE role")
    @WithMockUser(roles = "LOCATAIRE")
    void shouldRejectPropertyCreationWithoutProprietaireRole() throws Exception {
        mockMvc.perform(post("/api/v2/properties").contextPath("/api")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should reject statistics access without ADMIN role")
    @WithMockUser(roles = "PROPRIETAIRE")
    void shouldRejectStatisticsWithoutAdminRole() throws Exception {
        mockMvc.perform(get("/api/v2/properties/statistics").contextPath("/api"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should allow public access to cities endpoint")
    void shouldAllowPublicAccessToCities() throws Exception {
        mockMvc.perform(get("/api/v2/properties/cities").contextPath("/api"))
                .andExpect(status().isOk());
    }
}
