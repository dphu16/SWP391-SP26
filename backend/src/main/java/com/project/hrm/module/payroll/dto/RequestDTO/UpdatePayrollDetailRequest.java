package com.project.hrm.module.payroll.dto.RequestDTO;


import jakarta.validation.constraints.Min;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdatePayrollDetailRequest {
    // HR có thể sửa giờ làm hoặc sửa trực tiếp số tiền
    @Min(0)
    private BigDecimal totalOtHours;

    @Min(0)
    private BigDecimal totalAbsentDays;

    // Cho phép sửa đè số tiền nếu cần thiết (Manual Override)
    private BigDecimal grossSalaryAdjustment;
}
