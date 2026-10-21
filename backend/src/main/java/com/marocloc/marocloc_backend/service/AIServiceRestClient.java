package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AIServiceRestClient {

    private final RestTemplate aiRestTemplate;

    public AIServiceRestClient(RestTemplate aiRestTemplate) {
        this.aiRestTemplate = aiRestTemplate;
    }

    public AIChatResponse chat(String message, String sessionId, String language, String userRole) {
        AIChatRequest request = new AIChatRequest(message);
        request.setSessionId(sessionId);
        request.setLanguage(language);
        request.setUserRole(userRole);

        ResponseEntity<AIChatResponse> response = aiRestTemplate.postForEntity(
                "/smart/chat", request, AIChatResponse.class
        );
        return response.getBody();
    }

    public AISearchResponse search(String query, int topK) {
        AISearchRequest request = new AISearchRequest();
        request.setQuery(query);
        request.setTopK(topK);

        ResponseEntity<AISearchResponse> response = aiRestTemplate.postForEntity(
                "/search", request, AISearchResponse.class
        );
        return response.getBody();
    }

    public AIChatResponse voiceChat(MultipartFile audioFile, String sessionId, String language, String userRole) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("audio", new MultipartFileResource(audioFile));
            if (sessionId != null && !sessionId.isBlank()) {
                body.add("sessionId", sessionId);
            }
            if (language != null && !language.isBlank()) {
                body.add("language", language);
            }
            if (userRole != null && !userRole.isBlank()) {
                body.add("user_role", userRole);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<AIChatResponse> response = aiRestTemplate.exchange(
                    "/voice/chat",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    AIChatResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Voice chat failed: " + e.getMessage(), e);
        }
    }

    public AIVoiceTranscribeResponse transcribeVoice(MultipartFile audioFile, String language) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("audio", new MultipartFileResource(audioFile));
            if (language != null && !language.isBlank()) {
                body.add("language", language);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<AIVoiceTranscribeResponse> response = aiRestTemplate.exchange(
                    "/voice/transcribe",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    AIVoiceTranscribeResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Voice transcription failed: " + e.getMessage(), e);
        }
    }

    public SentimentResponse analyzeSentiment(String text, String language) {
        try {
            SentimentRequest request = SentimentRequest.builder()
                    .text(text)
                    .language(language != null ? language : "auto")
                    .build();

            ResponseEntity<SentimentResponse> response = aiRestTemplate.postForEntity(
                    "/sentiment/analyze", request, SentimentResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            // Graceful fallback when AI service is unavailable
            return SentimentResponse.builder()
                    .label("NEUTRAL")
                    .score(0.0)
                    .confidence(0.5)
                    .languageDetected(language)
                    .build();
        }
    }

    private static class MultipartFileResource extends ByteArrayResource {
        private final String filename;

        public MultipartFileResource(MultipartFile file) throws Exception {
            super(file.getBytes());
            this.filename = file.getOriginalFilename();
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
