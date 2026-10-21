package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.ConversationDTO;
import com.marocloc.marocloc_backend.dto.MessageDTO;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.Message;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.notification.service.NotificationService;
import com.marocloc.marocloc_backend.notification.template.NotificationTemplate;
import com.marocloc.marocloc_backend.repository.MessageRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public MessageDTO sendMessage(String senderEmail, Long receiverId, String content, Long propertyId) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new NotFoundException("User", receiverId));

        if (sender.getId().equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send message to yourself");
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .propertyId(propertyId)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);
        notificationService.createFromTemplate(NotificationTemplate.newMessage(
                receiver.getId(), sender.getId(), sender.getName(), null));
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getConversation(String userEmail, Long otherUserId, int page, int size, String sortDirection) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        Sort.Direction direction = Sort.Direction.ASC;
        if (sortDirection != null) {
            try {
                direction = Sort.Direction.fromString(sortDirection);
            } catch (IllegalArgumentException ignored) {
                // keep default ASC
            }
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "timestamp"));
        return messageRepository.findConversation(user.getId(), otherUserId, pageable).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationDTO> getConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        Long userId = user.getId();
        Pageable pageable = PageRequest.of(0, 500, Sort.by("timestamp").descending());
        Page<Message> page = messageRepository.findParticipantMessages(userId, pageable);

        Map<Long, Long> unreadBySender = messageRepository.countUnreadBySender(userId).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        Set<Long> propertyIds = page.getContent().stream()
                .map(Message::getPropertyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> propertyTitles = propertyRepository.findAllById(propertyIds).stream()
                .collect(Collectors.toMap(Property::getId, Property::getTitle));

        Map<Long, ConversationDTO> convMap = new java.util.LinkedHashMap<>();
        for (Message m : page.getContent()) {
            Long partnerId = m.getSender().getId().equals(userId) ? m.getReceiver().getId() : m.getSender().getId();
            if (partnerId.equals(userId)) continue;

            convMap.computeIfAbsent(partnerId, pid -> {
                User partner = m.getSender().getId().equals(pid) ? m.getSender() : m.getReceiver();
                String title = m.getPropertyId() != null ? propertyTitles.get(m.getPropertyId()) : null;
                return ConversationDTO.builder()
                        .partnerId(pid)
                        .partnerName(partner.getName())
                        .partnerAvatar(partner.getAvatar())
                        .partnerRole(partner.getRole() != null ? partner.getRole().name() : null)
                        .lastMessage(m.getContent())
                        .lastMessageDate(m.getTimestamp())
                        .unreadCount(unreadBySender.getOrDefault(pid, 0L))
                        .propertyId(m.getPropertyId())
                        .propertyTitle(title)
                        .build();
            });
        }

        return convMap.values().stream()
                .sorted(Comparator.comparing(ConversationDTO::getLastMessageDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getUnreadMessages(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        return messageRepository.findByReceiverIdOrderByTimestampDesc(user.getId()).stream()
                .filter(m -> !m.getIsRead())
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message", messageId));

        if (!message.getReceiver().getId().equals(user.getId())) {
            throw new SecurityException("Only the receiver can mark this message as read");
        }

        message.setIsRead(true);
        messageRepository.save(message);
    }

    @Override
    public long getUnreadCount(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .map(user -> messageRepository.countByReceiverIdAndIsReadFalse(user.getId()))
                .orElse(0L);
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message", messageId));

        if (!message.getSender().getId().equals(user.getId()) && !message.getReceiver().getId().equals(user.getId())) {
            throw new SecurityException("Only participants can delete this message");
        }

        messageRepository.delete(message);
    }

    private MessageDTO mapToDTO(Message message) {
        return MessageDTO.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .senderRole(message.getSender().getRole() != null ? message.getSender().getRole().name() : null)
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getName())
                .receiverRole(message.getReceiver().getRole() != null ? message.getReceiver().getRole().name() : null)
                .content(message.getContent())
                .isRead(message.getIsRead())
                .timestamp(message.getTimestamp())
                .propertyId(message.getPropertyId())
                .propertyTitle(null)
                .build();
    }

}
