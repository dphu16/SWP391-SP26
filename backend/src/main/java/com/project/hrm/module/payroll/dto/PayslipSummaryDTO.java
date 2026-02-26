package com.project.hrm.module.payroll.dto;

import com.project.hrm.module.payroll.enums.PayslipStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PayslipSummaryDTO {
    private UUID payslipId;
    private String period; // Ví dụ: "10/2023"
    private BigDecimal netSalary; // Thực lĩnh
    private PayslipStatus status;
    private LocalDate paidAt;
}
