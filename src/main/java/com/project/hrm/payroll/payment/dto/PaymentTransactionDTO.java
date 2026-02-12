package com.project.hrm.payroll.payment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentTransactionDTO {
    private UUID txnId;
    private UUID payslipId;
    private BigDecimal amount;
    private String status;
}
