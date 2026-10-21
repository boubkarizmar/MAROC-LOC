package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import com.marocloc.marocloc_backend.dto.ConversationDTO;
import com.marocloc.marocloc_backend.dto.MessageDTO;
import com.marocloc.marocloc_backend.dto.SendMessageRequest;
import com.marocloc.marocloc_backend.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Message controller with role-based access
 * Only LOCATAIRE, PROPRIETAIRE, or ADMIN can send and read messages
 */
@RestController
@RequestMapping(ApiRoutes.MESSAGES)
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MessageController {

    private final MessageService messageService;

    /**
     * Send message to another user
     */
    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        MessageDTO sent = messageService.sendMessage(
                userDetails.getUsername(),
                request.getReceiverId(),
                request.getContent(),
                request.getPropertyId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    /**
     * Get list of conversations for the authenticated user.
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(messageService.getConversations(userDetails.getUsername()));
    }

    /**
     * Get conversation with specific user (paginated).
     */
    @GetMapping("/conversation")
    public ResponseEntity<List<MessageDTO>> getConversation(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "ASC") String sort,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                messageService.getConversation(userDetails.getUsername(), userId, page, size, sort)
        );
    }

    /**
     * Get unread messages count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        long count = messageService.getUnreadCount(userDetails.getUsername());
        return ResponseEntity.ok(count);
    }

    /**
     * Mark message as read
     */
    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        messageService.markAsRead(messageId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    /**
     * Delete a message
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        messageService.deleteMessage(messageId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
