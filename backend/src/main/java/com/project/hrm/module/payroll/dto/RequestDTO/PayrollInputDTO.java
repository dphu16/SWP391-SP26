package com.project.hrm.payroll.compensation.dto.RequestDTO;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
@Getter
public class PayrollInputDTO {

    private UUID employeeId;
    private String fullName;

    private BigDecimal baseSalary;

    private BigDecimal totalWorkingHours;
    private BigDecimal totalOvertimeHours;
    private Long totalAbsentDays;
}
