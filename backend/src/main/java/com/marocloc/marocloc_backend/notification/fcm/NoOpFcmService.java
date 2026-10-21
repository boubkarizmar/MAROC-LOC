package com.marocloc.marocloc_backend.notification.fcm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnMissingBean(value = FcmService.class, ignored = NoOpFcmService.class)
public class NoOpFcmService implements FcmService {

    @Override
    public void registerToken(Long userId, String token, String deviceType) {
        log.debug("FCM token registration skipped (no-op): user={}, token={}", userId, token != null ? token.substring(0, Math.min(10, token.length())) + "..." : null);
    }

    @Override
    public void unregisterToken(Long userId, String token) {
        log.debug("FCM token unregistration skipped (no-op): user={}", userId);
    }

    @Override
    public void sendPush(Long userId, String title, String body, String actionUrl) {
        log.debug("FCM push skipped (no-op): user={}, title={}", userId, title);
    }
}
