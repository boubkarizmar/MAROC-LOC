package com.marocloc.marocloc_backend.notification.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ApiResponse;
import com.marocloc.marocloc_backend.notification.fcm.FcmTokenService;
import com.marocloc.marocloc_backend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiRoutes.FCM)
@RequiredArgsConstructor
public class FcmController {

    private final FcmTokenService fcmTokenService;
    private final UserRepository userRepository;

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FcmTokenRequest request) {
        Long userId = resolveUserId(userDetails);
        fcmTokenService.saveToken(userId, request.token(), request.deviceType());
        return ResponseEntity.ok(ApiResponse.success(null, "FCM token registered"));
    }

    @PostMapping("/unregister")
    public ResponseEntity<ApiResponse<Void>> unregisterToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FcmTokenRequest request) {
        Long userId = resolveUserId(userDetails);
        fcmTokenService.deleteToken(userId, request.token());
        return ResponseEntity.ok(ApiResponse.success(null, "FCM token unregistered"));
    }

    public record FcmTokenRequest(@NotBlank String token, String deviceType) {
    }
}
