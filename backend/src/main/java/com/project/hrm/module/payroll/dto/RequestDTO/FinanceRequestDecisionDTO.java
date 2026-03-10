package com.project.hrm.module.payroll.dto.RequestDTO;

import lombok.Data;

import java.util.UUID;

@Data
public class FinanceRequestDecisionDTO {
    private UUID approverId;
    private String financeNote;
}
