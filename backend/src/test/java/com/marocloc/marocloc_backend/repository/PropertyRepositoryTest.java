package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.PropertyType;
import com.marocloc.marocloc_backend.model.PropertyCategory;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import com.marocloc.marocloc_backend.AbstractIntegrationTest;
import com.marocloc.marocloc_backend.config.QueryDslConfig;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(QueryDslConfig.class)
@ActiveProfiles("test")
class PropertyRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private TestEntityManager testEntityManager;

    @Test
    void shouldSaveAndRetrieveProperty() {
        Property property = Property.builder()
                .title("Appartement moderne à Casablanca")
                .description("Superbe appartement moderne et spacieux situé au cœur du centre-ville de Casablanca, proche de tous commerces et transports en commun.")
                .price(new BigDecimal("850000"))
                .city("Casablanca")
                .address("Boulevard Mohammed V")
                .type(PropertyType.RENT)
                .category(PropertyCategory.APARTMENT)
                .status(PropertyStatus.APPROVED)
                .surface(85.0)
                .rooms(3)
                .latitude(33.5731)
                .longitude(-7.5898)
                .owner(User.builder()
                        .name("Test Owner")
                        .email("owner@test.com")
                        .password("password")
                        .role(Role.PROPRIETAIRE)
                        .build())
                .build();

        User savedOwner = testEntityManager.persistAndFlush(property.getOwner());
        property.setOwner(savedOwner);
        Property saved = propertyRepository.save(property);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getLocation()).isNotNull(); // PostGIS point should be auto-created

        Property found = propertyRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getCity()).isEqualTo("Casablanca");
        assertThat(found.getFinalPrice()).isEqualTo(new BigDecimal("850000.00"));
    }

    @Test
    void searchByFullText_shouldReturnResultsWhenQueryIsNull() {
        var page = propertyRepository.searchByFullText(null, List.of(PropertyStatus.APPROVED), Pageable.unpaged());
        assertThat(page).isNotNull();
    }

    @Test
    void searchByFullText_shouldReturnResultsWhenQueryIsEmpty() {
        var page = propertyRepository.searchByFullText("", List.of(PropertyStatus.APPROVED), Pageable.unpaged());
        assertThat(page).isNotNull();
    }
}
