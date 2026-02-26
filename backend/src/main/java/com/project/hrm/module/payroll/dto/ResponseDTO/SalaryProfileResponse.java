package com.project.hrm.module.payroll.dto.ResponseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class SalaryProfileResponse {
    private UUID profileId;
    private UUID employeeId;
    private BigDecimal baseSalary;
    private Map<String, Object> allowances;
    private String taxCode;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
}
