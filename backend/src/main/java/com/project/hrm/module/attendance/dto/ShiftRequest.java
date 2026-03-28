package com.project.hrm.module.attendance.dto;

import lombok.Data;

@Data
public class ShiftRequest {
    private String name;
    private String startTime;
    private String endTime;
}