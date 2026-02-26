package com.project.hrm.module.attendance.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class BulkScheduleRequest {
    private UUID employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private UUID shiftId;
}