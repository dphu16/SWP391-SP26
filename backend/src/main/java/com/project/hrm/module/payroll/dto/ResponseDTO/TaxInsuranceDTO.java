package com.project.hrm.module.payroll.dto.ResponseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TaxInsuranceDTO {
    private UUID employeeId;
    private String employeeName;
    private String department;

    private BigDecimal grossSalary;
    private BigDecimal baseSalary;

    // Breakdown
    private BigDecimal bhxh; // 8%
    private BigDecimal bhyt; // 1.5%
    private BigDecimal bhtn; // 1%
    private BigDecimal totalIns; // 10.5% (sum of the above)

    private BigDecimal pit; // Personal Income Tax
    private BigDecimal totalDeduct; // totalIns + pit
    private BigDecimal netSalary;
}
