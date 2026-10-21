package com.marocloc.marocloc_backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.marocloc.marocloc_backend.AbstractIntegrationTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Security Config Authorization Tests")
class SecurityConfigAuthorizationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should permit public access to GET properties")
    void shouldPermitPublicAccessToGetProperties() throws Exception {
        mockMvc.perform(get("/api/v2/properties").contextPath("/api"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should permit public access to GET property by ID")
    void shouldPermitPublicAccessToGetPropertyById() throws Exception {
        mockMvc.perform(get("/api/v2/properties/1").contextPath("/api"))
                .andExpect(status().isNotFound()); // 404 is fine, means auth passed
    }

    @Test
    @DisplayName("Should permit public access to search")
    void shouldPermitPublicAccessToSearch() throws Exception {
        mockMvc.perform(get("/api/v2/properties/search").contextPath("/api"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should reject POST properties without PROPRIETAIRE role")
    @WithMockUser(roles = "LOCATAIRE")
    void shouldRejectPostPropertiesWithoutProprietaireRole() throws Exception {
        mockMvc.perform(post("/api/v2/properties").contextPath("/api"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should reject admin endpoints without ADMIN role")
    @WithMockUser(roles = "PROPRIETAIRE")
    void shouldRejectAdminEndpointsWithoutAdminRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").contextPath("/api"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should require authentication for favorites")
    void shouldRequireAuthenticationForFavorites() throws Exception {
        mockMvc.perform(get("/api/v1/favorites").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should permit public access to auth endpoints")
    void shouldPermitPublicAccessToAuthEndpoints() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contextPath("/api"))
                .andExpect(status().isBadRequest()); // 400 means auth passed (missing body)
    }

    @Test
    @DisplayName("Should permit public access to cities endpoint")
    void shouldPermitPublicAccessToCities() throws Exception {
        mockMvc.perform(get("/api/v2/properties/cities").contextPath("/api"))
                .andExpect(status().isOk());
    }
}
