package com.marocloc.marocloc_backend.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationPreferenceResponse {

    private Long id;
    private Long userId;
    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private Boolean smsEnabled;
    private Boolean inAppEnabled;
    private LocalTime quietHoursStart;
    private LocalTime quietHoursEnd;
}
