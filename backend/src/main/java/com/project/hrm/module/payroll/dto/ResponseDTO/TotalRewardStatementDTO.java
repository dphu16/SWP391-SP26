package com.project.hrm.module.payroll.dto.ResponseDTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class TotalRewardStatementDTO {
    private String employeeName;
    private String employeeCode;
    private String period; // e.g., "Year 2026" or "Month 02/2026"

    // Cash components
    private BigDecimal totalGrossSalary;
    private BigDecimal totalNetSalary;
    private BigDecimal totalCashAllowances;
    
    // Deductions
    private BigDecimal totalTaxPaid;
    private BigDecimal totalInsurancePaid;

    // Non-cash benefits (The "hidden" value)
    private BigDecimal totalNonCashBenefitsValue;
    private List<BenefitItemDTO> benefitItems;
    
    // The big number!
    private BigDecimal grandTotalRewardValue;

    @Data
    @Builder
    public static class BenefitItemDTO {
        private String benefitName;
        private String benefitType;
        private BigDecimal calculatedValue;
    }
}
