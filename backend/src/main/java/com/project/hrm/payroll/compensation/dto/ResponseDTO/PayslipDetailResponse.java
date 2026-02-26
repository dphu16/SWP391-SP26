package com.project.hrm.payroll.compensation.dto.ResponseDTO;

import com.project.hrm.payroll.common.enums.PayslipStatus;
import com.project.hrm.payroll.compensation.dto.PayslipItemDTO;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class PayslipDetailResponse {

    private UUID payslipId;

    private BigDecimal baseSalary;
    private BigDecimal totalAllowances;
    private BigDecimal grossSalary;

    private BigDecimal taxAmount;
    private BigDecimal insuranceAmount;
    private BigDecimal totalDeductions;

    private BigDecimal netSalary;

    private List<PayslipItemDTO> incomes;
    private List<PayslipItemDTO> deductions;

    private PayslipStatus status;

    private OffsetDateTime confirmedAt;
    private OffsetDateTime paidAt;
}
