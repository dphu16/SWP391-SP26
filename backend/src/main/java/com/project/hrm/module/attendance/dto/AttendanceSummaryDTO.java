package com.project.hrm.module.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryDTO {
    private UUID employeeId;
    private String employeeCode;
    private String fullName;
    private String departmentName;

    private int month;
    private int year;

    private BigDecimal totalWorkingHours;
    private int totalLateDays;
    private int totalEarlyLeaveDays;
    private int totalMissingPunchDays;
}