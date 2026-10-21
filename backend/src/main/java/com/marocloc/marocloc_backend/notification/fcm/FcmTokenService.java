package com.marocloc.marocloc_backend.notification.fcm;

import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public void saveToken(Long userId, String token, String deviceType) {
        if (token == null || token.isBlank()) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        fcmTokenRepository.findByUserIdAndToken(userId, token)
                .ifPresentOrElse(
                        existing -> {
                            existing.setDeviceType(deviceType);
                            fcmTokenRepository.save(existing);
                        },
                        () -> fcmTokenRepository.save(FcmToken.builder()
                                .user(user)
                                .token(token)
                                .deviceType(deviceType)
                                .build())
                );
    }

    @Transactional(readOnly = true)
    public List<FcmToken> findByUserId(Long userId) {
        return fcmTokenRepository.findByUserId(userId);
    }

    @Transactional
    public void deleteToken(Long userId, String token) {
        fcmTokenRepository.deleteByUserIdAndToken(userId, token);
    }
}
