package com.project.hrm.module.attendance.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class WorkScheduleResponse {
    private UUID id;
    private LocalDate date;
    private ShiftResponse shift;
}