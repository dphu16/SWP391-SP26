package com.project.hrm.payroll.compensation.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Data
public class SalaryProfileDTO {
    private UUID employeeId;
    private BigDecimal baseSalary;
    private Map<String, Object> allowances;
    private String taxCode;
}

