package com.project.hrm.payroll.payment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentBatchDTO {
    private UUID batchId;
    private UUID periodId;
    private BigDecimal totalAmount;
    private String status;
}
