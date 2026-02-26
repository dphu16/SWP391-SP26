package com.project.hrm.module.payroll.dto;

import com.project.hrm.module.payroll.enums.PayslipStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PayslipDetailDTO {
    private UUID payslipId;

    // Thông tin kỳ lương
    private int month;
    private int year;
    private LocalDate startDate;
    private LocalDate endDate;

    // Tổng hợp
    private BigDecimal baseSalary;
    private BigDecimal totalAllowances;
    private BigDecimal grossSalary;     // Tổng thu nhập
    private BigDecimal taxAmount;       // Thuế
    private BigDecimal insuranceAmount; // Bảo hiểm
    private BigDecimal totalDeductions; // Tổng khấu trừ
    private BigDecimal netSalary;       // Thực lĩnh

    // Trạng thái
    private PayslipStatus status;
    private LocalDate paidAt;

    // Danh sách chi tiết từng dòng (Allowances, Bonus, Deductions...)
    private List<PayslipItemDto> items;

    @Data
    @Builder
    public static class PayslipItemDto {
        private String itemName;
        private BigDecimal amount;
        private String type; // "INCOME" (1) hoặc "DEDUCTION" (2)
    }
}
