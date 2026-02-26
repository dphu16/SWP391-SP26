package com.project.hrm.module.payroll.dto.RequestDTO;


import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PayrollReviewDTO {
    private UUID detailId;
    private UUID employeeId;
    private String employeeName;
    private String department; // Nếu có bảng Department

    // Các con số quan trọng cần review
    private BigDecimal baseSalary;
    private BigDecimal totalOtHours;
    private BigDecimal otPay;
    private BigDecimal totalAbsentDays;
    private BigDecimal absentDeduction;
    private BigDecimal grossSalary;

    // Cờ cảnh báo (Ví dụ: true nếu lương = 0 hoặc OT > 40h)
    private boolean hasWarning;
    private String warningMessage;
}
