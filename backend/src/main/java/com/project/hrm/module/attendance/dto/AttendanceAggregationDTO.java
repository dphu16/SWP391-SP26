package com.project.hrm.module.attendance.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAggregationDTO {
    private UUID employeeId;
    private BigDecimal totalWorkingHours; // Tổng giờ làm
    private BigDecimal totalOtHours;      // Tổng giờ OT
    private Long totalAbsentDays;         // Tổng ngày vắng
}
