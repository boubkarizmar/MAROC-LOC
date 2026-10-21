package com.marocloc.marocloc_backend.notification.scheduler;

import com.marocloc.marocloc_backend.model.Advertisement;
import com.marocloc.marocloc_backend.model.AdvertisementStatus;
import com.marocloc.marocloc_backend.model.PropertyVisit;
import com.marocloc.marocloc_backend.notification.model.NotificationType;
import com.marocloc.marocloc_backend.notification.repository.NotificationRepository;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.AdvertisementRepository;
import com.marocloc.marocloc_backend.repository.PropertyVisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final AdvertisementRepository advertisementRepository;
    private final PropertyVisitRepository propertyVisitRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    /**
     * Advertisement expiration reminders: 7, 3, 1 days before endDate.
     * Runs every day at 08:00.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void sendAdvertisementExpirationReminders() {
        log.info("Running advertisement expiration reminder scheduler");
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate sevenDaysLater = LocalDate.now().plusDays(8);

        List<Advertisement> ads = advertisementRepository.findByIsActiveTrueAndStatusAndEndDateBetweenOrderByEndDateAsc(
                AdvertisementStatus.ACTIVE, tomorrow, sevenDaysLater);

        for (Advertisement ad : ads) {
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), ad.getEndDate());
            if (daysLeft != 7 && daysLeft != 3 && daysLeft != 1) {
                continue;
            }
            if (alreadyNotified(ad.getCreatedByUserId(), NotificationType.ADVERTISEMENT_EXPIRING_SOON, ad.getId(), "ADVERTISEMENT", 23)) {
                continue;
            }
            notificationService.createFromTemplate(
                    NotificationTemplate.advertisementExpiringSoon(ad.getCreatedByUserId(), ad.getId(), daysLeft)
            );
        }
    }

    /**
     * Visit reminders: 24h, 3h, 30min before visit.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedRate = 15 * 60 * 1000)
    @Transactional
    public void sendVisitReminders() {
        log.debug("Running visit reminder scheduler");
        LocalDateTime now = LocalDateTime.now();

        sendVisitReminderWindow(now.plusMinutes(25), now.plusMinutes(35), 30);
        sendVisitReminderWindow(now.plusHours(2).plusMinutes(55), now.plusHours(3).plusMinutes(5), 180);
        sendVisitReminderWindow(now.plusHours(23).plusMinutes(55), now.plusHours(24).plusMinutes(5), 24 * 60);
    }

    private void sendVisitReminderWindow(LocalDateTime start, LocalDateTime end, long minutesBefore) {
        LocalDate date = start.toLocalDate();
        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();

        // If window crosses midnight, run twice (simplification: only same-day window here)
        if (!date.equals(end.toLocalDate())) {
            return;
        }

        List<PropertyVisit> visits = propertyVisitRepository.findUpcomingVisitsInWindow(date, startTime, endTime);
        for (PropertyVisit visit : visits) {
            Long propertyId = visit.getPropertyId();
            String title = visit.getProperty() != null ? visit.getProperty().getTitle() : "votre bien";

            // Notify visitor
            if (!alreadyNotified(visit.getVisitorId(), NotificationType.VISIT_REMINDER, visit.getId(), "VISIT", 12)) {
                notificationService.createFromTemplate(
                        NotificationTemplate.visitReminder(visit.getVisitorId(), visit.getId(), propertyId, title, minutesBefore)
                );
            }
            // Notify owner
            if (!alreadyNotified(visit.getOwnerId(), NotificationType.VISIT_REMINDER, visit.getId(), "VISIT", 12)) {
                notificationService.createFromTemplate(
                        NotificationTemplate.visitReminder(visit.getOwnerId(), visit.getId(), propertyId, title, minutesBefore)
                );
            }
        }
    }

    private boolean alreadyNotified(Long userId, NotificationType type, Long entityId, String entityType, int hoursAgo) {
        if (userId == null) return false;
        LocalDateTime since = LocalDateTime.now().minusHours(hoursAgo);
        List<com.marocloc.marocloc_backend.notification.model.Notification> recent =
                notificationRepository.findRecentByUserTypeAndEntity(userId, type, entityId, entityType, since);
        return !recent.isEmpty();
    }
}
