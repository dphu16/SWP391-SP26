package com.project.hrm.payroll.compensation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class PayslipDetailDTO {
    private UUID detailId;
    private UUID payslipId;

    private String itemName;   // VD: Base Salary, Tax, Insurance
    private BigDecimal amount;
    private String type;
}
