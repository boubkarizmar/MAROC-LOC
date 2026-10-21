package com.marocloc.marocloc_backend.notification.event;

import com.marocloc.marocloc_backend.notification.model.Notification;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NotificationCreatedEvent extends ApplicationEvent {

    private final Notification notification;

    public NotificationCreatedEvent(Object source, Notification notification) {
        super(source);
        this.notification = notification;
    }
}
