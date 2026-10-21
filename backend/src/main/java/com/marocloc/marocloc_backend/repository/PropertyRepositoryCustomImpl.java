package com.marocloc.marocloc_backend.repository;

import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyStatus;
import com.marocloc.marocloc_backend.model.QProperty;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.data.domain.Sort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@RequiredArgsConstructor
public class PropertyRepositoryCustomImpl implements PropertyRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QProperty property = QProperty.property;

    @Override
    public List<String> findDistinctCities() {
        return queryFactory
                .select(property.city)
                .distinct()
                .from(property)
                .where(property.city.isNotNull().and(property.city.ne("")))
                .orderBy(property.city.asc())
                .fetch();
    }

    // =====================================================
    // 🔎 DYNAMIC SEARCH WITH ALL FILTERS
    // =====================================================
    @Override
    public Page<Property> findPropertiesWithDynamicFilters(
            String keyword,
            String city,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String type,
            String category,
            String status,
            Boolean isVerified,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Integer minRooms,
            Integer maxRooms,
            Double minSurface,
            Double maxSurface,
            Boolean furnished,
            Boolean hasParking,
            Boolean hasPool,
            Boolean hasElevator,
            Boolean hasAirConditioning,
            Boolean hasInternet,
            Boolean hasSecurity,
            Boolean hasBalcony,
            Boolean petAllowed,
            Boolean cityCenter,
            Boolean nearSchool,
            Boolean nearUniversity,
            Boolean nearMosque,
            Boolean nearHospital,
            Boolean nearMarket,
            Boolean nearTram,
            Boolean nearBus,
            Boolean nearTrainStation,
            Boolean popularArea,
            Boolean modernArea,
            Boolean quietArea,
            Boolean familyArea,
            String sunDirection,
            Boolean gardenView,
            Boolean streetView,
            Boolean seaView,
            String paymentMethod,
            Pageable pageable) {

        BooleanBuilder builder = new BooleanBuilder();

        // =====================================================
        // 🔍 TEXT SEARCH
        // =====================================================
        if (StringUtils.hasText(keyword)) {
            String search = "%" + keyword.trim() + "%";
            builder.and(
                    property.title.likeIgnoreCase(search)
                            .or(property.description.likeIgnoreCase(search))
            );
        }

        // =====================================================
        // 📍 LOCATION FILTERS
        // =====================================================
        if (StringUtils.hasText(city)) {
            builder.and(property.city.equalsIgnoreCase(city));
        }

        // =====================================================
        // 💰 PRICE FILTERS
        // =====================================================
        if (minPrice != null) {
            builder.and(property.price.goe(minPrice));
        }
        if (maxPrice != null) {
            builder.and(property.price.loe(maxPrice));
        }

        // =====================================================
        // 🏷 TYPE & CATEGORY
        // =====================================================
        if (StringUtils.hasText(type)) {
            builder.and(property.type.stringValue().equalsIgnoreCase(type));
        }
        if (StringUtils.hasText(category)) {
            builder.and(property.category.stringValue().equalsIgnoreCase(category));
        }

        // =====================================================
        // 📌 STATUS
        // =====================================================
        if (StringUtils.hasText(status)) {
            try {
                builder.and(property.status.stringValue().equalsIgnoreCase(status));
            } catch (IllegalArgumentException e) {
                // ignore
            }
        } else {
            builder.and(property.status.in(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE));
        }

        if (isVerified != null) {
            builder.and(property.isVerified.eq(isVerified));
        }

        // =====================================================
        // 🏠 ROOMS & SURFACE FILTERS
        // =====================================================
        if (minRooms != null) {
            builder.and(property.rooms.goe(minRooms));
        }
        if (maxRooms != null) {
            builder.and(property.rooms.loe(maxRooms));
        }
        if (minSurface != null) {
            builder.and(property.surface.goe(minSurface));
        }
        if (maxSurface != null) {
            builder.and(property.surface.loe(maxSurface));
        }

        // =====================================================
        // 🛋 FEATURES & EQUIPMENTS FILTERS
        // =====================================================
        if (furnished != null) builder.and(property.furnished.eq(furnished));
        if (hasParking != null) builder.and(property.hasParking.eq(hasParking));
        if (hasPool != null) builder.and(property.hasPool.eq(hasPool));
        if (hasElevator != null) builder.and(property.hasElevator.eq(hasElevator));
        if (hasAirConditioning != null) builder.and(property.hasAirConditioning.eq(hasAirConditioning));
        if (hasInternet != null) builder.and(property.hasInternet.eq(hasInternet));
        if (hasSecurity != null) builder.and(property.hasSecurity.eq(hasSecurity));
        if (hasBalcony != null) builder.and(property.hasBalcony.eq(hasBalcony));
        if (petAllowed != null) builder.and(property.petAllowed.eq(petAllowed));

        // =====================================================
        // 🏙️ ENVIRONMENT FILTERS
        // =====================================================
        if (cityCenter != null) builder.and(property.cityCenter.eq(cityCenter));
        if (nearSchool != null) builder.and(property.nearSchool.eq(nearSchool));
        if (nearUniversity != null) builder.and(property.nearUniversity.eq(nearUniversity));
        if (nearMosque != null) builder.and(property.nearMosque.eq(nearMosque));
        if (nearHospital != null) builder.and(property.nearHospital.eq(nearHospital));
        if (nearMarket != null) builder.and(property.nearMarket.eq(nearMarket));
        if (nearTram != null) builder.and(property.nearTram.eq(nearTram));
        if (nearBus != null) builder.and(property.nearBus.eq(nearBus));
        if (nearTrainStation != null) builder.and(property.nearTrainStation.eq(nearTrainStation));

        // =====================================================
        // 🏡 NEIGHBORHOOD FILTERS
        // =====================================================
        if (popularArea != null) builder.and(property.popularArea.eq(popularArea));
        if (modernArea != null) builder.and(property.modernArea.eq(modernArea));
        if (quietArea != null) builder.and(property.quietArea.eq(quietArea));
        if (familyArea != null) builder.and(property.familyArea.eq(familyArea));

        // =====================================================
        // 🧭 ORIENTATION & VIEWS FILTERS
        // =====================================================
        if (StringUtils.hasText(sunDirection)) {
            builder.and(property.sunDirection.stringValue().equalsIgnoreCase(sunDirection));
        }
        if (gardenView != null) builder.and(property.gardenView.eq(gardenView));
        if (streetView != null) builder.and(property.streetView.eq(streetView));
        if (seaView != null) builder.and(property.seaView.eq(seaView));

        // =====================================================
        // 💳 PAYMENT METHOD FILTER
        // =====================================================
        if (StringUtils.hasText(paymentMethod)) {
            builder.and(property.paymentMethod.stringValue().equalsIgnoreCase(paymentMethod));
        }

        // =====================================================
        // 📍 GEO LOCATION FILTER (Haversine Formula)
        // =====================================================
        if (latitude != null && longitude != null && radiusKm != null) {
            com.querydsl.core.types.dsl.NumberExpression<Double> distance =
                com.querydsl.core.types.dsl.Expressions.numberTemplate(Double.class,
                    "(6371 * acos(cos(radians({0})) * cos(radians({1})) * cos(radians({2}) - radians({3})) + sin(radians({0})) * sin(radians({1}))))",
                    latitude, property.latitude, property.longitude, longitude);
            builder.and(distance.loe(radiusKm));
            builder.and(property.latitude.isNotNull());
            builder.and(property.longitude.isNotNull());
        }

        // =====================================================
        // 📦 QUERY RESULT
        // =====================================================
        var query = queryFactory
                .selectFrom(property)
                .where(builder)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize());

        // Apply sorting from pageable
        if (pageable.getSort().isSorted()) {
            PathBuilder<Property> entityPath = new PathBuilder<>(Property.class, "property");
            for (Sort.Order order : pageable.getSort()) {
                @SuppressWarnings("unchecked")
                OrderSpecifier<?> orderSpecifier = new OrderSpecifier(
                        order.isAscending() ? com.querydsl.core.types.Order.ASC : com.querydsl.core.types.Order.DESC,
                        entityPath.get(order.getProperty())
                );
                query.orderBy(orderSpecifier);
            }
        } else {
            query.orderBy(property.createdAt.desc());
        }

        List<Property> results = query.fetch();

        Long total = queryFactory
                .select(property.count())
                .from(property)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(results, pageable, total != null ? total : 0L);
    }

    // =====================================================
    // 📍 NEARBY PROPERTIES
    // =====================================================
    @Override
    public Page<Property> findNearbyPropertiesPostGIS(
            Double latitude,
            Double longitude,
            Double radiusKm,
            Pageable pageable) {

        com.querydsl.core.types.dsl.NumberExpression<Double> distance =
            com.querydsl.core.types.dsl.Expressions.numberTemplate(Double.class,
                "(6371 * acos(cos(radians({0})) * cos(radians({1})) * cos(radians({2}) - radians({3})) + sin(radians({0})) * sin(radians({1}))))",
                latitude, property.latitude, property.longitude, longitude);

        com.querydsl.jpa.JPQLQuery<Property> query = queryFactory
                .selectFrom(property)
                .leftJoin(property.owner).fetchJoin()
                .where(property.status.in(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE)
                        .and(property.latitude.isNotNull())
                        .and(property.longitude.isNotNull())
                        .and(distance.loe(radiusKm)))
                .orderBy(distance.asc(), property.price.asc());

        List<Property> results = query.offset(pageable.getOffset()).limit(pageable.getPageSize()).fetch();
        long total = query.fetchCount();

        return new PageImpl<>(results, pageable, total);
    }
}