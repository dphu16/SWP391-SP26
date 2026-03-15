package com.project.hrm.module.corehr.repository;

import com.project.hrm.module.corehr.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(UUID userId);

    long countByRecipient_UserIdAndIsReadFalse(UUID userId);
}
