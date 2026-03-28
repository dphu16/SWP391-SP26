package com.project.hrm.module.attendance.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class WorkScheduleRequest {
    private LocalDate date;
    private UUID shiftId;
    private UUID employeeId;
}