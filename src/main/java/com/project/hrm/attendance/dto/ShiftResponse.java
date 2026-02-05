package com.project.hrm.attendance.dto;

import lombok.Data;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class ShiftResponse {
    private UUID id;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
}