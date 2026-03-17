package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.BenefitType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class EmployeeBenefitResponse {
    private UUID employeeBenefitId;
    private UUID benefitId;
    private String benefitName;
    private BenefitType benefitType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal appliedValue;
    private String status;
}
