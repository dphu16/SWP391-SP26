package com.project.hrm.payroll.compensation.dto.ResponseDTO;

import com.project.hrm.payroll.common.enums.InquiryStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class InquiryResponse {
    private UUID id;
    private String subject;
    private String message;
    private InquiryStatus status;
    private String hrResponse;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
