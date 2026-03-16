package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

/**
 * Prevents notification spam by enforcing:
 * 1. Rate limiting: max 1 notification per entity per N minutes
 * 2. Duplicate detection: same type+entity within a time window
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationSpamGuard {

    private final NotificationRepository notificationRepository;

    /** Default cooldown window in minutes. */
    private static final int COOLDOWN_MINUTES = 10;

    /**
     * Returns true if a notification of this type for this entity
     * was already created within the cooldown window.
     */
    public boolean isDuplicate(String type, String entityType, String entityId) {
        if (type == null || entityType == null || entityId == null) {
            return false;
        }

        OffsetDateTime since = OffsetDateTime.now().minusMinutes(COOLDOWN_MINUTES);
        long count = notificationRepository.countRecentByTypeAndEntity(
                type, entityType, entityId, since);

        if (count > 0) {
            log.debug("Spam guard blocked duplicate notification: type={}, entity={}/{}",
                    type, entityType, entityId);
            return true;
        }
        return false;
    }
}
