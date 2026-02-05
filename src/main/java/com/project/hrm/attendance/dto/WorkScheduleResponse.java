package com.project.hrm.attendance.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkScheduleResponse {
    private Long id;
    private LocalDate date;
    private ShiftResponse shift;
}