package com.marocloc.marocloc_backend.dto;

import com.marocloc.marocloc_backend.model.PropertyVisit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyVisitDTO {

    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private String propertyCity;
    private Long visitorId;
    private String visitorName;
    private Long ownerId;
    private String ownerName;
    private LocalDate visitDate;
    private LocalTime visitTime;
    private String status;
    private String notes;
    private String visitorPhone;
    private String visitorEmail;
    private String createdAt;

    public static PropertyVisitDTO fromEntity(PropertyVisit visit) {
        Long propId = visit.getPropertyId();
        if (propId == null && visit.getProperty() != null) {
            propId = visit.getProperty().getId();
        }
        Long visId = visit.getVisitorId();
        if (visId == null && visit.getVisitor() != null) {
            visId = visit.getVisitor().getId();
        }
        Long ownId = visit.getOwnerId();
        if (ownId == null && visit.getOwner() != null) {
            ownId = visit.getOwner().getId();
        }
        return PropertyVisitDTO.builder()
            .id(visit.getId())
            .propertyId(propId)
            .propertyTitle(visit.getProperty() != null ? visit.getProperty().getTitle() : null)
            .propertyCity(visit.getProperty() != null ? visit.getProperty().getCity() : null)
            .visitorId(visId)
            .visitorName(visit.getVisitor() != null ? visit.getVisitor().getName() : null)
            .ownerId(ownId)
            .ownerName(visit.getOwner() != null ? visit.getOwner().getName() : null)
            .visitDate(visit.getVisitDate())
            .visitTime(visit.getVisitTime())
            .status(visit.getStatus() != null ? visit.getStatus().name() : null)
            .notes(visit.getNotes())
            .visitorPhone(visit.getVisitorPhone())
            .visitorEmail(visit.getVisitorEmail())
            .createdAt(visit.getCreatedAt() != null ? visit.getCreatedAt().toString() : null)
            .build();
    }
}
