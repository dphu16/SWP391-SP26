package com.project.hrm.attendance.dto;

import lombok.Data;

@Data
public class ShiftRequest {
    private String name;
    private String startTime;
    private String endTime;
}