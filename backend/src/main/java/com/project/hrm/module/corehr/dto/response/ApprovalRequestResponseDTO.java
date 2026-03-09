package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.request.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApprovalRequestResponseDTO {

    private UUID requestId;
    private UUID employeeId;
    private RequestStatus status;
    private String reason;
    private LocalDateTime createdAt;
}
