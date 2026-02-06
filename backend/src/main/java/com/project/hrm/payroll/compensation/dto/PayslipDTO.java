package com.project.hrm.payroll.compensation.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class PayslipDTO {
    private UUID payslipId;
    private UUID employeeId;
    private UUID periodId;

    private BigDecimal grossSalary;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private String status;

    private List<PayslipDetailDTO> details;
}

