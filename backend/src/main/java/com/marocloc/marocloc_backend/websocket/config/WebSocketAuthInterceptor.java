package com.marocloc.marocloc_backend.websocket.config;

import com.marocloc.marocloc_backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String token = authHeaders.get(0);
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }
                try {
                    if (jwtTokenProvider.validateToken(token)) {
                        Authentication auth = jwtTokenProvider.getAuthentication(token);
                        accessor.setUser(auth);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        log.debug("WebSocket authenticated user: {}", auth.getName());
                    }
                } catch (Exception e) {
                    log.warn("WebSocket JWT validation failed: {}", e.getMessage());
                }
            }
        }
        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            SecurityContextHolder.clearContext();
            log.debug("WebSocket SecurityContext cleared after CONNECT");
        }
    }
}
