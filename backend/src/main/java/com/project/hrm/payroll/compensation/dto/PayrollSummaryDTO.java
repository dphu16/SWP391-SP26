package com.project.hrm.payroll.compensation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PayrollSummaryDTO {

    private Long totalEmployees;
    private Long totalPaid;
    private Long totalUnpaid;

    private BigDecimal totalGross;
    private BigDecimal totalDeductions;
    private BigDecimal totalNet;
}
