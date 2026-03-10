package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.PaymentBatchStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentBatchHistoryDTO {
    private UUID paymentBatchId;
    private UUID payrollBatchId;
    private Integer month;
    private Integer year;
    private BigDecimal totalAmount;
    private PaymentBatchStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private UUID processedById;
    private String processedByName;
    private long totalTransactions;
    private long successTransactions;
    private long failedTransactions;
}
