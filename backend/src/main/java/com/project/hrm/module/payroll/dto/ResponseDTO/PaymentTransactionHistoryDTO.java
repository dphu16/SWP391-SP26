package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentTransactionHistoryDTO {
    private UUID transactionId;
    private UUID paymentBatchId;
    private UUID payslipId;
    private UUID employeeId;
    private String employeeName;
    private BigDecimal amount;
    private TransactionStatus status;
    private String bankResponseCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
