package com.marocloc.marocloc_backend.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApiRoutesTest {

    @Test
    void routesDoNotDuplicateServletContextPath() {
        assertThat(ApiRoutes.AUTH).isEqualTo("/v1/auth");
        assertThat(ApiRoutes.AI).isEqualTo("/v1/ai");
        assertThat(ApiRoutes.PROPERTIES_V2).isEqualTo("/v2/properties");
        assertThat(ApiRoutes.ADMIN).doesNotStartWith("/api");
    }
}
