package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.SalaryInquiryStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SalaryInquiryDto {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID payslipId;
    private String subject;
    private String message;
    private SalaryInquiryStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime resolvedAt;

    // Response của HR (null nếu chưa có)
    private HrResponseDetail hrResponse;

    @Data
    @Builder
    public static class HrResponseDetail {
        private UUID responseId;
        private String responderName;
        private String officialResponse;
        private String attachmentUrl;
        private OffsetDateTime createdAt;
        // internalNote KHÔNG có ở đây vì employee không được xem
    }
}
