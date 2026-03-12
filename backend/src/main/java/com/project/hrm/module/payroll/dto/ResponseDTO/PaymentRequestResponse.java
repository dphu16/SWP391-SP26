package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentRequestResponse {
    private UUID requestId;
    private UUID payrollBatchId;
    private UUID requesterId;
    private String requesterName;
    private UUID sourceAccountId;
    private String sourceAccountName;
    private BigDecimal totalAmountRequested;
    private PaymentRequestStatus status;
    private String hrNote;
    private String financeNote;
    private String reportUrl;
    private com.project.hrm.module.payroll.enums.PaymentRequestType type;
    private OffsetDateTime approvedAt;
    private OffsetDateTime createdAt;
}