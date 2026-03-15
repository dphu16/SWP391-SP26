package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Get all notifications for a specific user (direct recipient)
     * ordered by recent first.
     */
    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Count unread notifications for a specific user.
     */
    long countByRecipient_UserIdAndIsReadFalse(UUID userId);

    /**
     * Anti-spam: check for duplicate notification in a time window.
     */
    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE n.type = :type
              AND n.entityType = :entityType
              AND n.entityId = :entityId
              AND n.createdAt > :since
            """)
    long countRecentByTypeAndEntity(
            @Param("type") String type,
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("since") OffsetDateTime since);

    /**
     * Batch mark-as-read for all notifications of a user.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.userId = :userId AND n.isRead = false")
    void markAllReadByUserId(@Param("userId") UUID userId);
}

