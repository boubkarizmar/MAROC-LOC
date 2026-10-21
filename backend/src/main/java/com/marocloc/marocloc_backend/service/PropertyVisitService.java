package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.dto.PropertyVisitDTO;
import com.marocloc.marocloc_backend.dto.ScheduleVisitRequest;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.PropertyVisit;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.PropertyVisitRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyVisitService {

    private final PropertyVisitRepository visitRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ApiResponse<PropertyVisitDTO> scheduleVisit(ScheduleVisitRequest request, String visitorEmail) {
        try {
            Property property = propertyRepository.findById(request.getPropertyId())
                .orElse(null);
            if (property == null) {
                return ApiResponse.failure("Property not found", "INVALID_PROPERTY");
            }

            User visitor = userRepository.findByEmail(visitorEmail).orElse(null);
            if (visitor == null) {
                return ApiResponse.failure("Visitor not found", "INVALID_VISITOR");
            }

            User owner = property.getOwner();
            if (owner == null) {
                return ApiResponse.failure("Property owner not found", "INVALID_OWNER");
            }

            LocalDate visitDate = LocalDate.parse(request.getVisitDate());
            LocalTime visitTime = LocalTime.parse(request.getVisitTime());

            // Check if date is in the future
            if (visitDate.isBefore(LocalDate.now())) {
                return ApiResponse.failure("Visit date must be in the future", "INVALID_DATE");
            }

            // Check for double booking at same time
            Long existingCount = visitRepository.countActiveVisitsAtTime(property.getId(), visitDate, visitTime);
            if (existingCount > 0) {
                return ApiResponse.failure("This time slot is already booked", "TIME_SLOT_TAKEN");
            }

            PropertyVisit visit = PropertyVisit.builder()
                .property(property)
                .visitor(visitor)
                .owner(owner)
                .visitDate(visitDate)
                .visitTime(visitTime)
                .visitorPhone(request.getVisitorPhone())
                .visitorEmail(request.getVisitorEmail())
                .notes(request.getNotes())
                .status(PropertyVisit.VisitStatus.PENDING)
                .build();

            PropertyVisit saved = visitRepository.save(visit);
            notificationService.createFromTemplate(NotificationTemplate.visitScheduled(
                    owner.getId(), visitor.getId(), saved.getId(), property.getId(), property.getTitle()));
            log.info("Visit scheduled: id={}, property={}, visitor={}, date={} {}",
                saved.getId(), property.getId(), visitor.getId(), visitDate, visitTime);

            return ApiResponse.success(PropertyVisitDTO.fromEntity(saved), "Visit scheduled successfully");
        } catch (Exception e) {
            log.error("Error scheduling visit", e);
            return ApiResponse.error("Failed to schedule visit", e.getMessage(), 500);
        }
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<PropertyVisitDTO>> getMyVisits(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.failure("User not found", "INVALID_USER");
        }

        List<PropertyVisit> visits = visitRepository.findAllByUserId(user.getId());
        List<PropertyVisitDTO> dtos = visits.stream()
            .map(PropertyVisitDTO::fromEntity)
            .collect(Collectors.toList());

        return ApiResponse.success(dtos, "Visits retrieved successfully");
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<PropertyVisitDTO>> getVisitsForOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail).orElse(null);
        if (owner == null) {
            return ApiResponse.failure("Owner not found", "INVALID_USER");
        }

        List<PropertyVisit> visits = visitRepository.findByOwnerIdOrderByVisitDateDesc(owner.getId());
        List<PropertyVisitDTO> dtos = visits.stream()
            .map(PropertyVisitDTO::fromEntity)
            .collect(Collectors.toList());

        return ApiResponse.success(dtos, "Owner visits retrieved successfully");
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<PropertyVisitDTO>> getVisitsByProperty(Long propertyId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.failure("User not found", "INVALID_USER");
        }

        Property property = propertyRepository.findById(propertyId).orElse(null);
        if (property == null) {
            return ApiResponse.failure("Property not found", "INVALID_PROPERTY");
        }

        // Only owner or admin can see visits for a property
        if (!property.getOwner().getId().equals(user.getId()) && !user.getRole().name().equals("ADMIN")) {
            return ApiResponse.unauthorized("You are not authorized to view visits for this property");
        }

        List<PropertyVisit> visits = visitRepository.findByPropertyIdOrderByVisitDateDesc(propertyId);
        List<PropertyVisitDTO> dtos = visits.stream()
            .map(PropertyVisitDTO::fromEntity)
            .collect(Collectors.toList());

        return ApiResponse.success(dtos, "Property visits retrieved successfully");
    }

    @Transactional
    public ApiResponse<PropertyVisitDTO> rejectVisit(Long visitId, String reason, String userEmail) {
        try {
            PropertyVisit visit = visitRepository.findById(visitId).orElse(null);
            if (visit == null) {
                return ApiResponse.notFound("Visit not found");
            }

            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return ApiResponse.failure("User not found", "INVALID_USER");
            }

            if (!visit.getOwnerId().equals(user.getId())) {
                return ApiResponse.unauthorized("Only the property owner can reject visits");
            }

            visit.setStatus(PropertyVisit.VisitStatus.CANCELLED);
            if (reason != null && !reason.isEmpty()) {
                visit.setNotes((visit.getNotes() != null ? visit.getNotes() + "\n" : "") + "Rejection reason: " + reason);
            }
            PropertyVisit saved = visitRepository.save(visit);
            Property property = propertyRepository.findById(visit.getPropertyId()).orElse(null);
            if (property != null) {
                notificationService.createFromTemplate(NotificationTemplate.visitCancelled(
                        visit.getVisitorId(), user.getId(), saved.getId(), property.getId(), property.getTitle()));
            }

            return ApiResponse.success(PropertyVisitDTO.fromEntity(saved), "Visit rejected successfully");
        } catch (Exception e) {
            log.error("Error rejecting visit", e);
            return ApiResponse.error("Failed to reject visit", e.getMessage(), 500);
        }
    }

    @Transactional
    public ApiResponse<PropertyVisitDTO> updateVisitStatus(Long visitId, String status, String userEmail) {
        try {
            PropertyVisit visit = visitRepository.findById(visitId).orElse(null);
            if (visit == null) {
                return ApiResponse.notFound("Visit not found");
            }

            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return ApiResponse.failure("User not found", "INVALID_USER");
            }

            // Only owner or visitor can update
            if (!visit.getVisitorId().equals(user.getId()) && !visit.getOwnerId().equals(user.getId())) {
                return ApiResponse.unauthorized("You are not authorized to update this visit");
            }

            PropertyVisit.VisitStatus newStatus = PropertyVisit.VisitStatus.valueOf(status.toUpperCase());
            visit.setStatus(newStatus);
            PropertyVisit saved = visitRepository.save(visit);

            Property property = propertyRepository.findById(visit.getPropertyId()).orElse(null);
            notifyVisitStatusChange(saved, user, property, newStatus);

            return ApiResponse.success(PropertyVisitDTO.fromEntity(saved), "Visit status updated");
        } catch (IllegalArgumentException e) {
            return ApiResponse.failure("Invalid status", "VALIDATION_ERROR");
        } catch (Exception e) {
            log.error("Error updating visit status", e);
            return ApiResponse.error("Failed to update visit", e.getMessage(), 500);
        }
    }

    @Transactional
    public ApiResponse<Void> cancelVisit(Long visitId, String userEmail) {
        PropertyVisit visit = visitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ApiResponse.notFound("Visit not found");
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return ApiResponse.failure("User not found", "INVALID_USER");
        }

        if (!visit.getVisitorId().equals(user.getId()) && !visit.getOwnerId().equals(user.getId())) {
            return ApiResponse.unauthorized("You are not authorized to cancel this visit");
        }

        visit.setStatus(PropertyVisit.VisitStatus.CANCELLED);
        PropertyVisit saved = visitRepository.save(visit);
        Property property = propertyRepository.findById(visit.getPropertyId()).orElse(null);
        if (property != null) {
            Long recipientId = visit.getOwnerId().equals(user.getId()) ? visit.getVisitorId() : visit.getOwnerId();
            notificationService.createFromTemplate(NotificationTemplate.visitCancelled(
                    recipientId, user.getId(), saved.getId(), property.getId(), property.getTitle()));
        }
        return ApiResponse.success(null, "Visit cancelled successfully");
    }

    private void notifyVisitStatusChange(PropertyVisit visit, User actor, Property property, PropertyVisit.VisitStatus newStatus) {
        if (property == null) return;
        if (newStatus == PropertyVisit.VisitStatus.CONFIRMED && visit.getOwnerId().equals(actor.getId())) {
            notificationService.createFromTemplate(NotificationTemplate.visitConfirmed(
                    visit.getVisitorId(), actor.getId(), visit.getId(), property.getId(), property.getTitle()));
        } else if (newStatus == PropertyVisit.VisitStatus.CANCELLED) {
            Long recipientId = visit.getOwnerId().equals(actor.getId()) ? visit.getVisitorId() : visit.getOwnerId();
            notificationService.createFromTemplate(NotificationTemplate.visitCancelled(
                    recipientId, actor.getId(), visit.getId(), property.getId(), property.getTitle()));
        }
    }
}
