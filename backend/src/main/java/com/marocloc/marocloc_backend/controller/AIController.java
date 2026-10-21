package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.*;
import com.marocloc.marocloc_backend.model.Role;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.UserRepository;
import com.marocloc.marocloc_backend.service.AIServiceRestClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

@RestController
@RequestMapping(ApiRoutes.AI)
public class AIController {

    private final AIServiceRestClient aiServiceClient;
    private final UserRepository userRepository;

    public AIController(AIServiceRestClient aiServiceClient, UserRepository userRepository) {
        this.aiServiceClient = aiServiceClient;
        this.userRepository = userRepository;
    }

    private String resolveUserRole(@AuthenticationPrincipal UserDetails userDetails, String explicitRole) {
        if (explicitRole != null && !explicitRole.isBlank()) {
            return explicitRole;
        }
        if (userDetails == null) {
            return null; // guest
        }
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null || user.getRole() == null) {
            return null;
        }
        Role role = user.getRole();
        if (role == Role.ADMIN) return "admin";
        if (role == Role.PROPRIETAIRE) return "proprietaire";
        if (role == Role.LOCATAIRE) return "locataire";
        return null;
    }

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(
            @Valid @RequestBody AIChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userRole = resolveUserRole(userDetails, request.getUserRole());
        AIChatResponse response = aiServiceClient.chat(
                request.getMessage(),
                request.getSessionId(),
                request.getLanguage(),
                userRole
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AISearchResponse> search(@Valid @RequestBody AISearchRequest request) {
        AISearchResponse response = aiServiceClient.search(
                request.getQuery(),
                request.getTopK()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/voice/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AIVoiceTranscribeResponse> transcribeVoice(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(value = "language", required = false) String language
    ) {
        AIVoiceTranscribeResponse response = aiServiceClient.transcribeVoice(audio, language);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/voice/chat", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AIChatResponse> chatWithVoice(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "language", required = false) String language,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userRole = resolveUserRole(userDetails, null);
        AIChatResponse response = aiServiceClient.voiceChat(audio, sessionId, language, userRole);
        return ResponseEntity.ok(response);
    }
}
