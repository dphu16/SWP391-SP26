package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.dto.response.NotificationResponseDTO;
import com.project.hrm.module.corehr.entity.Notification;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.repository.NotificationRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationSpamGuard spamGuard;
    private final NotificationWebSocketPublisher wsPublisher;

    // ──────────────────────────────── Create ────────────────────────────────

    /**
     * Create a notification targeted at a specific user by userId.
     * Includes anti-spam check.
     */
    @Transactional
    public void createForUser(UUID userId, String title, String message,
                              String type, String entityType, String entityId) {
        if (spamGuard.isDuplicate(type, entityType, entityId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.USER_NOT_FOUND,
                        "User not found: " + userId));

        Notification notification = Notification.builder()
                .recipient(user)
                .title(title)
                .message(message)
                .type(type)
                .entityType(entityType)
                .entityId(entityId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Created notification [{}] for user: {}", type, user.getEmail());

        // Push via WebSocket
        wsPublisher.sendToUser(user.getEmail(), toDTO(notification));
    }

    // ──────────────────────────────── Read ──────────────────────────────────

    /**
     * Get all notifications for the currently logged-in user by email.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotificationsForUser(String email) {
        User user = findUserByEmail(email);
        return notificationRepository
                .findByRecipient_UserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications count for the current user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = findUserByEmail(email);
        return notificationRepository.countByRecipient_UserIdAndIsReadFalse(user.getUserId());
    }

    // ──────────────────────────── Mark as read ──────────────────────────────

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public void markAsRead(UUID notificationId, String email) {
        User user = findUserByEmail(email);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.NOTIFICATION_NOT_FOUND,
                        "Notification not found: " + notificationId));

        // Verify ownership
        boolean isRecipient = notification.getRecipient() != null
                && notification.getRecipient().getUserId().equals(user.getUserId());

        if (!isRecipient) {
            throw new BusinessRuleException(ErrorCode.ACCESS_DENIED, "Access denied");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for the logged-in user.
     */
    @Transactional
    public void markAllAsRead(String email) {
        User user = findUserByEmail(email);
        notificationRepository.markAllReadByUserId(user.getUserId());
    }

    // ──────────────────────────── Helpers ────────────────────────────────────

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.USER_NOT_FOUND,
                        "User not found: " + email));
    }

    private NotificationResponseDTO toDTO(Notification n) {
        return NotificationResponseDTO.builder()
                .notificationId(n.getNotificationId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
