package com.project.hrm.attendance.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class ShiftResponse {
    private Long id;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    // Có thể thêm field tính toán, ví dụ: "totalHours"
}