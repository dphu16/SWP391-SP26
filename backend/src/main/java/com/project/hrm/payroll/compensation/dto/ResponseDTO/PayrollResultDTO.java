package com.project.hrm.payroll.compensation.dto.ResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
public class PayrollResultDTO {

    private UUID employeeId;

    private BigDecimal baseSalary;
    private BigDecimal workingDays;
    private BigDecimal otHours;
    private BigDecimal absentDays;

    private BigDecimal otPay;
    private BigDecimal absentDeduction;

    private BigDecimal finalSalary;
}
