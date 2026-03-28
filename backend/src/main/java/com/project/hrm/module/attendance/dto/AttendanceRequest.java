package com.project.hrm.module.attendance.dto;

import com.project.hrm.module.attendance.enums.AttendanceStatus;
import com.project.hrm.module.attendance.enums.CheckInType;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class AttendanceRequest {
    // 1. For Check-in / Check-out
    private UUID employeeId;
    private CheckInType type;

    // 2. For Manager edit
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private AttendanceStatus status;

    // Optional: allow Manager to manually set OT hours
    private BigDecimal otHours;
}