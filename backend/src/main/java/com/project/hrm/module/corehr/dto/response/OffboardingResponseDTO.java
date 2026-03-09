package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.enums.OffboardingStatus;
import com.project.hrm.module.corehr.enums.OffboardingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OffboardingResponseDTO {

    private UUID offboardingId;
    private UUID employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private String positionTitle;
    private String avatarUrl;

    private OffboardingType type;
    private OffboardingStatus status;
    private String reason;

    private LocalDate requestDate;
    private LocalDate expectedLastDay;
    private LocalDate officialLastDay;

    private UUID requestedBy;
    private String requestedByName;

    private UUID approvedByManager;
    private String approvedByManagerName;
    private LocalDate managerApprovedDate;

    private UUID confirmedByHr;
    private String confirmedByHrName;
    private LocalDate hrConfirmedDate;

    private String cancelReason;
    private UUID cancelledBy;
    private String cancelledByName;
    private LocalDate cancelledDate;
}
