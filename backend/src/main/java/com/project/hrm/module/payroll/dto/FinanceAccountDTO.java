package com.project.hrm.module.payroll.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class FinanceAccountDTO {
    private UUID accountId;
    private String accountName;
    private String accountNumber;
    private String bankName;
    private BigDecimal currentBalance;
    private String status;
}
