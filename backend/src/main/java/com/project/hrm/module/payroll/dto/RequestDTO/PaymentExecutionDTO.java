package com.project.hrm.module.payroll.dto.RequestDTO;

import lombok.Data;

import java.util.UUID;

@Data
public class PaymentExecutionDTO {
    private UUID sourceAccountId;
    private String bankRefCode;
    private String financeNote;
}
