package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.dto.response.NotificationResponseDTO;
import com.project.hrm.module.corehr.entity.Notification;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.corehr.enums.EmployeeRole;
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

    /**
     * Create a system notification for all HR users (used when employee submits
     * bank info).
     */
    @Transactional
    public void createNotificationForAllHR(String employeeName) {
        List<User> hrUsers = userRepository.findByRoles_Name(EmployeeRole.ROLE_HR);
        String message = "Nhân viên " + employeeName
                + " vừa cập nhật thông tin ngân hàng. Vui lòng kiểm tra và xác nhận.";
        for (User hrUser : hrUsers) {
            Notification notification = Notification.builder()
                    .recipient(hrUser)
                    .message(message)
                    .type("BANK_UPDATE")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
        log.info("Created system notifications for {} HR user(s) about bank update by: {}", hrUsers.size(),
                employeeName);
    }

    /**
     * Get all notifications for the currently logged-in user by email.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotificationsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND, "User not found: " + email));
        return notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public void markAsRead(UUID notificationId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND, "User not found: " + email));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Notification not found: " + notificationId));
        if (!notification.getRecipient().getUserId().equals(user.getUserId())) {
            throw new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND, "Access denied");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for the logged-in user.
     */
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessRuleException(ErrorCode.EMPLOYEE_NOT_FOUND, "User not found: " + email));
        List<Notification> unread = notificationRepository
                .findByRecipient_UserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationResponseDTO toDTO(Notification n) {
        return NotificationResponseDTO.builder()
                .notificationId(n.getNotificationId())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
