package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.enums.PersonnelChangeStatus;
import com.project.hrm.module.corehr.enums.PersonnelChangeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PersonnelChangeResponseDTO {
    private UUID changeId;
    private UUID employeeId;
    private String employeeName;
    private String employeeCode;
    private String departmentName;
    private UUID positionId;
    private PersonnelChangeType changeType;
    private PersonnelChangeStatus status;
    private String reason;
    private Map<String, Object> oldValues;
    private Map<String, Object> newValues;
    private UUID requestedBy;
    private String requestedByName;
    private UUID managerApprovedBy;
    private String managerApprovedByName;
    private LocalDateTime managerApprovedDate;
    private UUID hrConfirmedBy;
    private String hrConfirmedByName;
    private LocalDateTime hrConfirmedDate;
    private String rejectReason;
    private LocalDateTime createdAt;
}
