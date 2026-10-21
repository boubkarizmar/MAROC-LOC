package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.ConversationDTO;
import com.marocloc.marocloc_backend.dto.MessageDTO;

import java.util.List;

public interface MessageService {

    MessageDTO sendMessage(String senderEmail, Long receiverId, String content, Long propertyId);

    List<MessageDTO> getConversation(String userEmail, Long otherUserId, int page, int size, String sortDirection);

    List<ConversationDTO> getConversations(String userEmail);

    List<MessageDTO> getUnreadMessages(String userEmail);

    void markAsRead(Long messageId, String userEmail);

    long getUnreadCount(String userEmail);

    void deleteMessage(Long messageId, String userEmail);
}
