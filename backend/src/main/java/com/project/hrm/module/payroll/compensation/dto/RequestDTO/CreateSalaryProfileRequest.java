package com.project.hrm.module.payroll.compensation.dto.RequestDTO;

import lombok.Data;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
public class CreateSalaryProfileRequest {
    @NotNull
    private UUID employeeId;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal baseSalary;

    private Map<String, Object> allowances;

    private String taxCode;

    @NotNull
    private LocalDate effectiveFrom;
}
