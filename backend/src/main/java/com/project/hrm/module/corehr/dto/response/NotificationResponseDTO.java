package com.project.hrm.module.corehr.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class NotificationResponseDTO {

    private UUID notificationId;
    private String title;
    private String message;
    private String type;
    private String entityType;
    private String entityId;
    private Boolean isRead;
    private OffsetDateTime createdAt;
}

