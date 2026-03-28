package com.project.hrm.module.request.dto;

import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestResponseDTO {
    private UUID requestId;
    private String employeeName;
    private String deptName;     // Hiển thị phòng ban thay vì position
    private RequestType requestType;
    private RequestStatus status;
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
}