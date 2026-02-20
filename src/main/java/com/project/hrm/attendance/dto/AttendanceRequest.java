package com.project.hrm.attendance.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class AttendanceRequest {
    // 1. Dùng cho Check-in / Check-out
    private UUID employeeId;
    private String type; // Gửi "IN" hoặc "OUT"

    // 2. Dùng cho Manager sửa công (Edit)
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String status;

    // (Tuỳ chọn) Cho phép Manager sửa tay giờ OT nếu cần
    // Nếu không gửi trường này, Service sẽ tự để mặc định là 0
    private BigDecimal otHours;
}