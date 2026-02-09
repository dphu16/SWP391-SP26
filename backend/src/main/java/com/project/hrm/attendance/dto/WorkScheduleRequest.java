package com.project.hrm.attendance.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkScheduleRequest {
    private LocalDate date;
    private Long shiftId;

}