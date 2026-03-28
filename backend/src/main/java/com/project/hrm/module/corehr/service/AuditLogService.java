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
    private final com.project.hrm.module.corehr.repository.EmployeeRepository employeeRepository;

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
            // Do not log updates that have no actual change
            if ("UPDATE".equalsIgnoreCase(actionType)) {
                String safeOld = oldValue == null ? "" : oldValue.trim();
                String safeNew = newValue == null ? "" : newValue.trim();
                if (safeOld.equals(safeNew)) {
                    return;
                }
            }
            // Validation: Ensure the affectedUserId (Employee ID) exists in the employees table
            if (affectedUserId != null) {
                if (!employeeRepository.existsById(affectedUserId)) {
                    log.warn("Attempted to log action for non-existent employee ID: {}. Setting to null to avoid FK violation.", affectedUserId);
                    affectedUserId = null;
                }
            }

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