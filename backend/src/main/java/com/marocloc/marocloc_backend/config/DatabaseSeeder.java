package com.marocloc.marocloc_backend.config;

import com.marocloc.marocloc_backend.model.*;
import com.marocloc.marocloc_backend.repository.*;
import com.marocloc.marocloc_backend.event.model.EventLog;
import com.marocloc.marocloc_backend.event.repository.EventLogRepository;
import com.marocloc.marocloc_backend.review.model.FraudReview;
import com.marocloc.marocloc_backend.review.repository.FraudReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Database Seeder for MAROC-LOC
 * Generates realistic Moroccan real estate data for testing
 * Includes users, properties, engagement metrics, ads, and AI training data
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final FavoriteRepository favoriteRepository;
    private final ReviewRepository reviewRepository;
    private final MessageRepository messageRepository;
    private final ViewedPropertyRepository viewedPropertyRepository;
    private final UserBehaviorRepository behaviorRepository;
    private final AdvertisementRepository advertisementRepository;
    private final AdvertisementPaymentRepository advertisementPaymentRepository;
    private final EventLogRepository eventLogRepository;
    private final FraudReviewRepository fraudReviewRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String[] MOROCCAN_CITIES = {
        "Casablanca", "Rabat", "Marrakech", "Fes", "Tanger", "Agadir",
        "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "Mohammedia",
        "El Jadida", "Beni Mellal", "Nador", "Khouribga", "Settat",
        "Larache", "Ksar El Kebir", "Taza", "Essaouira", "Ouarzazate"
    };

    private static final String[] STREETS = {
        "Boulevard Mohammed V", "Avenue Hassan II", "Rue de la Gare",
        "Boulevard d'Anfa", "Avenue des FAR", "Rue Ibn Toumert",
        "Boulevard Mohamed VI", "Avenue Allal El Fassi", "Rue Oued Zem",
        "Boulevard Zerktouni", "Avenue Abdelkrim El Khattabi",
        "Rue Moulay Ismail", "Boulevard Sidi Mohamed Ben Abdellah",
        "Avenue Al Marsa", "Rue Imam Ali", "Boulevard Al Massira"
    };

    private static final String[][] USER_DATA = {
        {"Youssef", "Alami", "youssef.alami@email.ma", "PROPRIETAIRE", "Casablanca"},
        {"Fatima", "Benali", "fatima.benali@email.ma", "LOCATAIRE", "Rabat"},
        {"Omar", "Chraibi", "omar.chraibi@email.ma", "PROPRIETAIRE", "Marrakech"},
        {"Amina", "Douiri", "amina.douiri@email.ma", "LOCATAIRE", "Fes"},
        {"Karim", "El Fassi", "karim.elfassi@email.ma", "PROPRIETAIRE", "Tanger"},
        {"Samira", "Ghazali", "samira.ghazali@email.ma", "LOCATAIRE", "Agadir"},
        {"Mehdi", "Hassani", "mehdi.hassani@email.ma", "PROPRIETAIRE", "Meknes"},
        {"Nadia", "Idrissi", "nadia.idrissi@email.ma", "LOCATAIRE", "Oujda"},
        {"Hassan", "Jabiri", "hassan.jabiri@email.ma", "PROPRIETAIRE", "Kenitra"},
        {"Laila", "Kadiri", "laila.kadiri@email.ma", "LOCATAIRE", "Tetouan"},
        {"Rachid", "Lahmami", "rachid.lahmami@email.ma", "PROPRIETAIRE", "Safi"},
        {"Sofia", "Mernissi", "sofia.mernissi@email.ma", "LOCATAIRE", "Mohammedia"},
        {"Adil", "Naciri", "adil.naciri@email.ma", "PROPRIETAIRE", "El Jadida"},
        {"Kawtar", "Oufkir", "kawtar.oufkir@email.ma", "LOCATAIRE", "Beni Mellal"},
        {"Tariq", "Qadi", "tariq.qadi@email.ma", "PROPRIETAIRE", "Nador"},
        {"Imane", "Rahmouni", "imane.rahmouni@email.ma", "LOCATAIRE", "Khouribga"},
        {"Mustapha", "Slaoui", "mustapha.slaoui@email.ma", "PROPRIETAIRE", "Settat"},
        {"Hanane", "Tazi", "hanane.tazi@email.ma", "LOCATAIRE", "Larache"},
        {"Brahim", "Wahbi", "brahim.wahbi@email.ma", "PROPRIETAIRE", "Ksar El Kebir"},
        {"Salma", "Zahraoui", "salma.zahraoui@email.ma", "LOCATAIRE", "Taza"},
        {"System", "Admin", "admin@gmail.com", "ADMIN", "Casablanca"}
    };

    private static final String[] PROPERTY_TITLES = {
        "Appartement moderne avec vue sur mer",
        "Villa luxueuse avec piscine privee",
        "Studio meuble en centre-ville",
        "Duplex spacieux avec terrasse",
        "Riad traditionnel renove",
        "Appartement familial pres des ecoles",
        "Bureau commercial bien situe",
        "Terrain constructible avec vue panoramique",
        "Maison de campagne avec jardin",
        "Penthouse avec jacuzzi",
        "Appartement etudiant economique",
        "Villa contemporaine avec garage",
        "Local commercial en angle de rue",
        "Appartement haut standing avec concierge",
        "Maison traditionnelle avec patio",
        "Studio neuf avec cuisine equipee",
        "Duplex avec vue sur la medina",
        "Villa avec jardin arboré",
        "Appartement lumineux avec balcon",
        "Bureau professionnel en zone affaires"
    };

    private static final Random RANDOM = new Random(42); // Fixed seed for reproducibility

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedAll() {
        seedAll(false);
    }

    @Transactional
    public void seedAll(boolean force) {
        log.info("🌱 Starting database seeding... (force={})", force);

        if (!force && userRepository.count() > 1) {
            log.warn("Database already contains data. Skipping seed. Use force=true to override.");
            return;
        }

        List<User> users = seedUsers();
        List<Property> properties = seedProperties(users);
        seedFavorites(users, properties);
        seedReviews(users, properties);
        seedMessages(users);
        seedViewedProperties(users, properties);
        seedUserBehaviors(users, properties);
        seedAdvertisements(users, properties);
        seedEventLogs(users, properties);
        seedFraudReviews(users, properties);

        log.info("✅ Database seeding complete!");
        log.info("   Users: {}", users.size());
        log.info("   Properties: {}", properties.size());
    }

    @Transactional
    public void seedMissingOnly() {
        log.info("🌱 Seeding missing data only...");
        List<User> users = userRepository.findAll();
        List<Property> properties = propertyRepository.findAll();
        if (advertisementRepository.count() == 0) {
            seedAdvertisements(users, properties);
        }
        if (eventLogRepository.count() == 0) {
            seedEventLogs(users, properties);
        }
        if (fraudReviewRepository.count() == 0) {
            seedFraudReviews(users, properties);
        }
        log.info("✅ Missing data seeding complete!");
    }

    private List<User> seedUsers() {
        log.info("👥 Seeding users...");
        List<User> users = new ArrayList<>();

        for (String[] data : USER_DATA) {
            User user = User.builder()
                    .name(data[0] + " " + data[1])
                    .fullName(data[0] + " " + data[1])
                    .firstNameLatin(data[0])
                    .lastNameLatin(data[1])
                    .email(data[2])
                    .password(passwordEncoder.encode(data[3].equals("ADMIN") ? "Admin@123" : "Password123!"))
                    .phoneNumber(generateMoroccanPhone())
                    .city(data[4])
                    .role(Role.valueOf(data[3]))
                    .isVerified(true)
                    .createdAt(randomDateWithin(90))
                    .build();
            users.add(userRepository.save(user));
        }
        return users;
    }

    private List<Property> seedProperties(List<User> owners) {
        log.info("🏘️ Seeding properties...");
        List<Property> properties = new ArrayList<>();
        List<User> proprietaires = owners.stream()
                .filter(u -> u.getRole() == Role.PROPRIETAIRE || u.getRole() == Role.ADMIN)
                .collect(Collectors.toList());

        for (int i = 0; i < 120; i++) {
            String city = MOROCCAN_CITIES[RANDOM.nextInt(MOROCCAN_CITIES.length)];
            PropertyCategory category = PropertyCategory.values()[RANDOM.nextInt(PropertyCategory.values().length - 1)];
            PropertyType type = PropertyType.values()[RANDOM.nextInt(PropertyType.values().length)];

            double price = generatePrice(category, type);
            double surface = generateSurface(category);
            int rooms = generateRooms(category);
            int bedrooms = Math.max(1, rooms - 1 - RANDOM.nextInt(2));
            int bathrooms = Math.max(1, bedrooms - RANDOM.nextInt(2));

            PropertyStatus status = RANDOM.nextDouble() < 0.7
                    ? PropertyStatus.APPROVED
                    : (RANDOM.nextDouble() < 0.5 ? PropertyStatus.PENDING : PropertyStatus.AVAILABLE);

            User owner = proprietaires.get(RANDOM.nextInt(proprietaires.size()));

            // Generate engagement metrics
            int viewCount = RANDOM.nextInt(500);
            int likeCount = (int) (viewCount * (0.1 + RANDOM.nextDouble() * 0.2));
            int shareCount = (int) (viewCount * (0.02 + RANDOM.nextDouble() * 0.05));
            int saveCount = (int) (viewCount * (0.05 + RANDOM.nextDouble() * 0.1));
            double engagementScore = calculateEngagementScore(viewCount, likeCount, shareCount, saveCount);

            Property property = Property.builder()
                    .title(PROPERTY_TITLES[RANDOM.nextInt(PROPERTY_TITLES.length)] + " - " + city + " " + (i + 1))
                    .description(generateDescription(city, category, type, rooms, surface))
                    .price(BigDecimal.valueOf(price))
                    .city(city)
                    .address(STREETS[RANDOM.nextInt(STREETS.length)] + ", " + city)
                    .type(type)
                    .category(category)
                    .status(status)
                    .surface(surface)
                    .rooms(rooms)
                    .bedrooms(bedrooms)
                    .bathrooms(bathrooms)
                    .latitude(getCityLatitude(city) + (RANDOM.nextDouble() - 0.5) * 0.1)
                    .longitude(getCityLongitude(city) + (RANDOM.nextDouble() - 0.5) * 0.1)
                    .viewCount((long) viewCount)
                    .additionalFees(0.0)
                    .discountPercentage(0.0)
                    .owner(owner)
                    .createdAt(randomDateWithin(60))
                    .updatedAt(LocalDateTime.now())
                    .furnished(RANDOM.nextBoolean())
                    .hasElevator(RANDOM.nextBoolean())
                    .hasParking(RANDOM.nextBoolean())
                    .hasPool(category == PropertyCategory.HOUSE && RANDOM.nextBoolean())
                    .hasGarden(category == PropertyCategory.HOUSE && RANDOM.nextBoolean())
                    .hasAirConditioning(RANDOM.nextBoolean())
                    .hasInternet(RANDOM.nextBoolean())
                    .hasSecurity(RANDOM.nextBoolean())
                    .petAllowed(RANDOM.nextBoolean())
                    .cityCenter(RANDOM.nextBoolean())
                    .nearSchool(RANDOM.nextBoolean())
                    .nearUniversity(RANDOM.nextBoolean())
                    .nearMosque(RANDOM.nextBoolean())
                    .nearHospital(RANDOM.nextBoolean())
                    .nearTram(RANDOM.nextBoolean())
                    .nearBus(RANDOM.nextBoolean())
                    .popularArea(RANDOM.nextBoolean())
                    .modernArea(RANDOM.nextBoolean())
                    .quietArea(RANDOM.nextBoolean())
                    .familyArea(RANDOM.nextBoolean())
                    .sunDirection(SunDirection.values()[RANDOM.nextInt(SunDirection.values().length)])
                    .buildingAge(RANDOM.nextInt(30))
                    .constructionYear(1990 + RANDOM.nextInt(35))
                    .condition(RANDOM.nextBoolean() ? PropertyCondition.GOOD : PropertyCondition.NEW)
                    .images(generateImages(i))
                    .build();

            properties.add(propertyRepository.save(property));
        }
        return properties;
    }

    private void seedFavorites(List<User> users, List<Property> properties) {
        log.info("❤️ Seeding favorites...");
        List<User> locataires = users.stream()
                .filter(u -> u.getRole() == Role.LOCATAIRE)
                .collect(Collectors.toList());

        for (User user : locataires) {
            int favCount = 3 + RANDOM.nextInt(8);
            Set<Integer> indices = new HashSet<>();
            while (indices.size() < favCount) {
                indices.add(RANDOM.nextInt(properties.size()));
            }
            for (int idx : indices) {
                Favorite fav = Favorite.builder()
                        .user(user)
                        .property(properties.get(idx))
                        .createdAt(randomDateWithin(30))
                        .build();
                favoriteRepository.save(fav);
            }
        }
    }

    private void seedReviews(List<User> users, List<Property> properties) {
        log.info("⭐ Seeding reviews...");
        List<User> locataires = users.stream()
                .filter(u -> u.getRole() == Role.LOCATAIRE)
                .collect(Collectors.toList());

        for (Property property : properties) {
            if (RANDOM.nextDouble() < 0.6) { // 60% of properties have reviews
                int reviewCount = 1 + RANDOM.nextInt(5);
                for (int i = 0; i < reviewCount; i++) {
                    User reviewer = locataires.get(RANDOM.nextInt(locataires.size()));
                    ReviewStatus reviewStatus = RANDOM.nextDouble() < 0.7
                            ? ReviewStatus.APPROVED
                            : (RANDOM.nextDouble() < 0.5 ? ReviewStatus.PENDING : ReviewStatus.FLAGGED);
                    Review review = Review.builder()
                            .rating(3 + RANDOM.nextInt(3)) // 3-5 stars
                            .comment(generateReviewComment(property.getCity()))
                            .user(reviewer)
                            .property(property)
                            .status(reviewStatus)
                            .createdAt(randomDateWithin(45))
                            .build();
                    reviewRepository.save(review);
                }
            }
        }
    }

    private void seedMessages(List<User> users) {
        log.info("💬 Seeding messages...");
        List<User> locataires = users.stream()
                .filter(u -> u.getRole() == Role.LOCATAIRE)
                .collect(Collectors.toList());
        List<User> proprietaires = users.stream()
                .filter(u -> u.getRole() == Role.PROPRIETAIRE)
                .collect(Collectors.toList());

        String[] messages = {
            "Bonjour, est-ce que la propriete est toujours disponible ?",
            "Quand puis-je visiter ?",
            "Est-ce que le prix est negociable ?",
            "La propriete est-elle meublee ?",
            "Y a-t-il un parking inclus ?",
            "Merci pour votre reponse rapide !",
            "Je suis interesse, pouvons-nous fixer un rendez-vous ?",
            "Est-ce que les charges sont incluses dans le loyer ?",
            "Quelle est la surface exacte ?",
            "Y a-t-il une caution a verser ?"
        };

        for (User locataire : locataires) {
            int msgCount = 2 + RANDOM.nextInt(5);
            for (int i = 0; i < msgCount; i++) {
                User proprio = proprietaires.get(RANDOM.nextInt(proprietaires.size()));
                // Locataire -> Proprio
                Message msg1 = Message.builder()
                        .sender(locataire)
                        .receiver(proprio)
                        .content(messages[RANDOM.nextInt(messages.length)])
                        .timestamp(LocalDateTime.now().minusDays(RANDOM.nextInt(30)))
                        .isRead(RANDOM.nextBoolean())
                        .build();
                messageRepository.save(msg1);

                // Proprio -> Locataire (reply)
                if (RANDOM.nextBoolean()) {
                    Message msg2 = Message.builder()
                            .sender(proprio)
                            .receiver(locataire)
                            .content("Merci pour votre message. Je vous contacte bientot.")
                            .timestamp(msg1.getTimestamp().plusHours(1 + RANDOM.nextInt(12)))
                            .isRead(true)
                            .build();
                    messageRepository.save(msg2);
                }
            }
        }
    }

    private void seedViewedProperties(List<User> users, List<Property> properties) {
        log.info("👁️ Seeding viewed properties...");
        List<User> locataires = users.stream()
                .filter(u -> u.getRole() == Role.LOCATAIRE)
                .collect(Collectors.toList());

        for (User user : locataires) {
            int viewCount = 5 + RANDOM.nextInt(20);
            for (int i = 0; i < viewCount; i++) {
                Property property = properties.get(RANDOM.nextInt(properties.size()));
                ViewedProperty vp = ViewedProperty.builder()
                        .user(user)
                        .property(property)
                        .viewedAt(randomDateWithin(30))
                        .viewDurationSeconds(30 + RANDOM.nextInt(300))
                        .build();
                viewedPropertyRepository.save(vp);
            }
        }
    }

    private void seedUserBehaviors(List<User> users, List<Property> properties) {
        log.info("🧠 Seeding user behaviors for AI recommendations...");
        List<User> locataires = users.stream()
                .filter(u -> u.getRole() == Role.LOCATAIRE)
                .collect(Collectors.toList());

        String[] behaviorTypes = {"VIEW", "FAVORITE", "CONTACT", "SEARCH", "SHARE"};

        for (User user : locataires) {
            int behaviorCount = 10 + RANDOM.nextInt(30);
            for (int i = 0; i < behaviorCount; i++) {
                String type = behaviorTypes[RANDOM.nextInt(behaviorTypes.length)];
                Property property = properties.get(RANDOM.nextInt(properties.size()));

                UserBehavior behavior = UserBehavior.builder()
                        .user(user)
                        .behaviorType(type)
                        .entityType("PROPERTY")
                        .entityId(property.getId())
                        .metadata("{\"city\":\"" + property.getCity() + "\",\"category\":\"" + property.getCategory() + "\",\"price\":" + property.getPrice() + "}")
                        .weight(calculateBehaviorWeight(type))
                        .sessionId("session-" + user.getId() + "-" + RANDOM.nextInt(100))
                        .createdAt(randomDateWithin(30))
                        .build();
                behaviorRepository.save(behavior);
            }
        }
    }

    private void seedAdvertisements(List<User> users, List<Property> properties) {
        log.info("📢 Seeding advertisements...");
        List<User> proprietaires = users.stream()
                .filter(u -> u.getRole() == Role.PROPRIETAIRE)
                .collect(Collectors.toList());

        AdvertisementPlan[] plans = {AdvertisementPlan.BOOST_BASIC, AdvertisementPlan.BOOST_PRO, AdvertisementPlan.PREMIUM_ADS};
        AdvertisementType[] adTypes = {AdvertisementType.BANNER, AdvertisementType.BOOST_PUBLICATION, AdvertisementType.FEATURED_PROPERTY};
        AdvertisementStatus[] statuses = {AdvertisementStatus.ACTIVE, AdvertisementStatus.PENDING_APPROVAL, AdvertisementStatus.PENDING_PAYMENT};
        PaymentStatus[] paymentStatuses = {PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.FAILED};

        List<Advertisement> ads = new ArrayList<>();

        for (int i = 0; i < 25; i++) {
            User user = proprietaires.get(RANDOM.nextInt(proprietaires.size()));
            Property property = properties.get(RANDOM.nextInt(properties.size()));
            AdvertisementPlan plan = plans[RANDOM.nextInt(plans.length)];
            AdvertisementStatus status = statuses[RANDOM.nextInt(statuses.length)];
            PaymentStatus paymentStatus = paymentStatuses[RANDOM.nextInt(paymentStatuses.length)];

            Advertisement ad = Advertisement.builder()
                    .title("Annonce " + (i + 1) + " - " + property.getCity())
                    .description("Promotion pour " + property.getTitle())
                    .type(adTypes[RANDOM.nextInt(adTypes.length)])
                    .plan(plan)
                    .status(status)
                    .paymentStatus(paymentStatus)
                    .isActive(status == AdvertisementStatus.ACTIVE)
                    .priority((int) calculatePriorityScore(property, plan))
                    .budget(BigDecimal.valueOf(100 + RANDOM.nextInt(900)))
                    .views((long) RANDOM.nextInt(500))
                    .clicks((long) RANDOM.nextInt(100))
                    .impressions((long) RANDOM.nextInt(1000))
                    .createdByUserId(user.getId())
                    .createdByUserEmail(user.getEmail())
                    .propertyId(property.getId())
                    .startDate(LocalDate.now().minusDays(RANDOM.nextInt(15)))
                    .endDate(LocalDate.now().plusDays(plan.getDurationDays()))
                    .createdAt(randomDateWithin(30))
                    .build();
            ads.add(ad);
        }
        advertisementRepository.saveAll(ads);

        // Create payments for paid ads (need saved IDs)
        List<AdvertisementPayment> payments = new ArrayList<>();
        for (Advertisement ad : ads) {
            if (ad.getPaymentStatus() == PaymentStatus.PAID) {
                payments.add(AdvertisementPayment.builder()
                        .advertisementId(ad.getId())
                        .userId(ad.getCreatedByUserId())
                        .amount(ad.getBudget().longValue())
                        .currency("MAD")
                        .status(PaymentStatus.PAID)
                        .createdAt(ad.getCreatedAt())
                        .build());
            }
        }
        advertisementPaymentRepository.saveAll(payments);
        log.info("   Created {} advertisements and {} payments", ads.size(), payments.size());
    }

    private void seedEventLogs(List<User> users, List<Property> properties) {
        log.info("📝 Seeding event logs...");
        List<EventLog> logs = new ArrayList<>();
        String[] eventTypes = {"property.view", "search.query", "user.login", "user.register", "favorite.add", "message.send"};
        String[] devices = {"desktop", "mobile", "tablet"};
        String[] cities = MOROCCAN_CITIES;

        for (int i = 0; i < 500; i++) {
            User user = users.get(RANDOM.nextInt(users.size()));
            String eventType = eventTypes[RANDOM.nextInt(eventTypes.length)];
            EventLog log = EventLog.builder()
                    .eventId(UUID.randomUUID())
                    .eventType(eventType)
                    .eventVersion(1)
                    .userId(user.getId())
                    .sessionId("session-" + RANDOM.nextInt(100))
                    .ipAddress("192.168.1." + RANDOM.nextInt(255))
                    .deviceType(devices[RANDOM.nextInt(devices.length)])
                    .city(cities[RANDOM.nextInt(cities.length)])
                    .payload("{}")
                    .serverTimestamp(randomDateWithin(30).atZone(ZoneId.systemDefault()).toInstant())
                    .processed(true)
                    .build();
            logs.add(log);
        }
        eventLogRepository.saveAll(logs);
        log.info("   Created {} event logs", logs.size());
    }

    private void seedFraudReviews(List<User> users, List<Property> properties) {
        log.info("🛡️ Seeding fraud reviews...");
        List<FraudReview> reviews = new ArrayList<>();
        String[] decisions = {"APPROVE", "FLAG", "BLOCK"};
        String[] explanations = {
            "Prix anormalement bas détecté",
            "Doublon potentiel identifié",
            "Compte récemment créé avec activité suspecte",
            "Photos stock détectées",
            "Coordonnées incohérentes"
        };

        for (int i = 0; i < 20; i++) {
            Property property = properties.get(RANDOM.nextInt(properties.size()));
            User reviewer = users.get(RANDOM.nextInt(users.size()));
            String decision = decisions[RANDOM.nextInt(decisions.length)];
            FraudReview review = FraudReview.builder()
                    .propertyId(property.getId())
                    .fraudScoreId((long) (i + 1))
                    .reviewedBy(reviewer.getId())
                    .finalDecision(decision)
                    .status(decision.equals("BLOCK") ? "BLOCKED" : "REVIEWED")
                    .explanation(explanations[RANDOM.nextInt(explanations.length)])
                    .explanationConfidence(0.6 + RANDOM.nextDouble() * 0.35)
                    .featureImportance("{\"price_deviation\":0.35,\"account_age\":0.25}")
                    .reviewTimeSeconds(5 + RANDOM.nextInt(120))
                    .reviewedAt(randomDateWithin(30))
                    .build();
            reviews.add(review);
        }
        fraudReviewRepository.saveAll(reviews);
        log.info("   Created {} fraud reviews", reviews.size());
    }

    // ===================== HELPER METHODS =====================

    private String generateMoroccanPhone() {
        return "+2126" + (10000000 + RANDOM.nextInt(90000000));
    }

    private double generatePrice(PropertyCategory category, PropertyType type) {
        double base = switch (category) {
            case APARTMENT -> 5000 + RANDOM.nextInt(15000);
            case HOUSE -> 8000 + RANDOM.nextInt(25000);
            case OFFICE -> 4000 + RANDOM.nextInt(12000);
            case SHOP -> 6000 + RANDOM.nextInt(10000);
            case CAFE -> 5000 + RANDOM.nextInt(8000);
            case GYM -> 7000 + RANDOM.nextInt(12000);
            default -> 5000 + RANDOM.nextInt(10000);
        };
        // Transaction type multiplier
        if (type == PropertyType.BUY) {
            base *= 100; // Price for purchase
        }
        return base;
    }

    private double generateSurface(PropertyCategory category) {
        return switch (category) {
            case APARTMENT -> 60 + RANDOM.nextInt(140);
            case HOUSE -> 100 + RANDOM.nextInt(300);
            case OFFICE -> 50 + RANDOM.nextInt(200);
            case SHOP -> 40 + RANDOM.nextInt(100);
            case CAFE -> 30 + RANDOM.nextInt(80);
            case GYM -> 100 + RANDOM.nextInt(200);
            default -> 50 + RANDOM.nextInt(100);
        };
    }

    private int generateRooms(PropertyCategory category) {
        return switch (category) {
            case APARTMENT -> 2 + RANDOM.nextInt(4);
            case HOUSE -> 3 + RANDOM.nextInt(5);
            case OFFICE -> 1 + RANDOM.nextInt(5);
            case SHOP -> 1 + RANDOM.nextInt(3);
            case CAFE -> 1 + RANDOM.nextInt(2);
            case GYM -> 2 + RANDOM.nextInt(4);
            default -> 2 + RANDOM.nextInt(3);
        };
    }

    private String generateDescription(String city, PropertyCategory category, PropertyType type, int rooms, double surface) {
        String typeStr = type == PropertyType.RENT ? "location" : (type == PropertyType.BUY ? "vente" : "credit-bail");
        String catStr = category.name().toLowerCase();
        return String.format(
            "Magnifique %s en %s a %s. Surface de %.0f m² avec %d pieces. " +
            "Ideal pour famille ou investissement. Proche de toutes commodites, transports et commerces. " +
            "Disponible immediatement pour %s. Contactez-nous pour une visite.",
            catStr, typeStr, city, surface, rooms, typeStr
        );
    }

    private String generateReviewComment(String city) {
        String[] comments = {
            "Tres belle propriete a " + city + ", je recommande !",
            "Excellente localisation, proprietaire tres agreable.",
            "Bon rapport qualite-prix, quartier calme.",
            "Propriete conforme a la description, merci !",
            "Superbe vue, bien ensoleille, parfait pour famille.",
            "Quelques travaux a prevoir mais globalement satisfait.",
            "Emplacement ideal, proche de tout. A recommander !",
            "Bonne experience, processus de location facile."
        };
        return comments[RANDOM.nextInt(comments.length)];
    }

    private List<String> generateImages(int index) {
        return List.of(
            "/uploads/property_" + index + "_1.jpg",
            "/uploads/property_" + index + "_2.jpg",
            "/uploads/property_" + index + "_3.jpg"
        );
    }

    private double calculateEngagementScore(int views, int likes, int shares, int saves) {
        return BigDecimal.valueOf(views * 1.0 + likes * 3.0 + shares * 5.0 + saves * 4.0)
                .divide(BigDecimal.valueOf(Math.max(views, 1)), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private double calculatePriorityScore(Property property, AdvertisementPlan plan) {
        double baseScore = property.getViewCount() != null ? property.getViewCount() * 0.1 : 0;
        double planMultiplier = switch (plan) {
            case BOOST_BASIC -> 1.0;
            case BOOST_PRO -> 1.5;
            case PREMIUM_ADS -> 2.0;
        };
        return baseScore * planMultiplier;
    }

    private double calculateBehaviorWeight(String type) {
        return switch (type) {
            case "CONTACT" -> 5.0;
            case "FAVORITE" -> 4.0;
            case "SHARE" -> 3.5;
            case "VIEW" -> 2.0;
            case "SEARCH" -> 1.5;
            default -> 1.0;
        };
    }

    private double getCityLatitude(String city) {
        return switch (city) {
            case "Casablanca" -> 33.5731;
            case "Rabat" -> 34.0209;
            case "Marrakech" -> 31.6295;
            case "Fes" -> 34.0181;
            case "Tanger" -> 35.7595;
            case "Agadir" -> 30.4278;
            case "Meknes" -> 33.8733;
            case "Oujda" -> 34.6819;
            case "Kenitra" -> 34.2610;
            case "Tetouan" -> 35.5889;
            case "Safi" -> 32.2994;
            case "Mohammedia" -> 33.6861;
            case "El Jadida" -> 33.2316;
            case "Beni Mellal" -> 32.3373;
            case "Nador" -> 35.1740;
            case "Khouribga" -> 32.8808;
            case "Settat" -> 33.0016;
            case "Larache" -> 35.1833;
            case "Ksar El Kebir" -> 35.0017;
            case "Taza" -> 34.2100;
            case "Essaouira" -> 31.5085;
            case "Ouarzazate" -> 30.9335;
            default -> 33.0;
        };
    }

    private double getCityLongitude(String city) {
        return switch (city) {
            case "Casablanca" -> -7.5898;
            case "Rabat" -> -6.8416;
            case "Marrakech" -> -7.9811;
            case "Fes" -> -5.0078;
            case "Tanger" -> -5.8340;
            case "Agadir" -> -9.5981;
            case "Meknes" -> -5.5407;
            case "Oujda" -> -1.9006;
            case "Kenitra" -> -6.5802;
            case "Tetouan" -> -5.3626;
            case "Safi" -> -9.2372;
            case "Mohammedia" -> -7.3870;
            case "El Jadida" -> -8.5007;
            case "Beni Mellal" -> -6.3600;
            case "Nador" -> -2.9287;
            case "Khouribga" -> -6.9063;
            case "Settat" -> -7.6190;
            case "Larache" -> -6.1667;
            case "Ksar El Kebir" -> -5.9070;
            case "Taza" -> -4.0100;
            case "Essaouira" -> -9.7595;
            case "Ouarzazate" -> -6.9370;
            default -> -7.0;
        };
    }

    private LocalDateTime randomDateWithin(int days) {
        return LocalDateTime.now().minusDays(RANDOM.nextInt(days)).minusHours(RANDOM.nextInt(24));
    }
}
