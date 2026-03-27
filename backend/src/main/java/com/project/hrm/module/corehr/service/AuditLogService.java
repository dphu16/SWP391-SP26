package com.project.hrm.module.corehr.service;

import com.project.hrm.module.corehr.dto.response.AuditLogResponseDTO;
import com.project.hrm.module.corehr.entity.AuditLog;
import com.project.hrm.module.corehr.repository.AuditLogRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void recordAction(
            String entityType,
            String entityId,
            UUID affectedUserId,
            String actionType,
            String fieldChanged,
            String oldValue,
            String newValue,
            String performedBy,
            String description) {

        try {
            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityName(entityType)
                    .entityId(entityId)
                    .affectedUserId(affectedUserId)
                    .actionType(actionType)
                    .fieldChanged(fieldChanged)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .performedBy(performedBy)
                    .description(description)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    public List<AuditLogResponseDTO> getEmployeeActivityLogs(
            UUID employeeId) {
        return auditLogRepository.findByAffectedUserIdOrderByCreatedAtDesc(employeeId).stream()
                .map(logEntry -> {
                    String actor = logEntry.getPerformedBy();
                    if (actor != null && actor.contains("@")) {
                        actor = userRepository.findByEmail(actor)
                                .map(u -> {
                                    if (u.getEmployee() != null && u.getEmployee().getFullName() != null
                                            && !u.getEmployee().getFullName().isBlank()) {
                                        return u.getEmployee().getFullName();
                                    }
                                    return u.getEmail();
                                })
                                .orElse(actor);
                    }

                    return AuditLogResponseDTO.builder()
                            .id(logEntry.getId())
                            .timestamp(logEntry.getCreatedAt())
                            .actor(actor)
                            .actionType(logEntry.getActionType())
                            .description(logEntry.getDescription())
                            .fieldChanged(logEntry.getFieldChanged())
                            .oldValue(logEntry.getOldValue())
                            .newValue(logEntry.getNewValue())
                            .build();
                }).toList();
    }
}