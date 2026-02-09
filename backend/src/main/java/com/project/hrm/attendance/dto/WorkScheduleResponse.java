package com.project.hrm.attendance.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class WorkScheduleResponse {
    private UUID id;
    private LocalDate date;
    private ShiftResponse shift;
}