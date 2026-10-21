package com.marocloc.marocloc_backend.notification.fcm;

public interface FcmService {

    void registerToken(Long userId, String token, String deviceType);

    void unregisterToken(Long userId, String token);

    void sendPush(Long userId, String title, String body, String actionUrl);
}
