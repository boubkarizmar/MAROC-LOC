package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.marocloc.marocloc_backend.AbstractIntegrationTest;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Admin Controller Security Tests")
class AdminControllerSecurityTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PropertyRepository propertyRepository;

    @Test
    @DisplayName("Should allow ADMIN to access users list")
    @WithMockUser(roles = "ADMIN")
    void shouldAllowAdminToAccessUsers() throws Exception {
        Page<User> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users").contextPath("/api"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should reject PROPRIETAIRE from accessing users list")
    @WithMockUser(roles = "PROPRIETAIRE")
    void shouldRejectProprietaireFromUsers() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").contextPath("/api"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should reject LOCATAIRE from accessing admin endpoints")
    @WithMockUser(roles = "LOCATAIRE")
    void shouldRejectLocataireFromAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").contextPath("/api"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should reject unauthenticated access to admin endpoints")
    void shouldRejectUnauthenticatedAdminAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should allow ADMIN to access platform stats")
    @WithMockUser(roles = "ADMIN")
    void shouldAllowAdminToAccessStats() throws Exception {
        when(userRepository.count()).thenReturn(100L);
        when(propertyRepository.count()).thenReturn(500L);
        when(propertyRepository.countByStatus(PropertyStatus.PENDING)).thenReturn(10L);
        when(userRepository.countByIsVerifiedTrue()).thenReturn(80L);

        mockMvc.perform(get("/api/v1/admin/stats").contextPath("/api"))
                .andExpect(status().isOk());
    }
}
