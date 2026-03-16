package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.dto.response.NotificationResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes notifications in real-time over WebSocket.
 *
 * Destination:
 *   - /user/{email}/queue/notifications   → specific user
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Push a notification to a specific user by email.
     */
    public void sendToUser(String email, NotificationResponseDTO dto) {
        messagingTemplate.convertAndSendToUser(
                email,
                "/queue/notifications",
                dto
        );
        log.debug("WS notification sent to user: {}", email);
    }
}
