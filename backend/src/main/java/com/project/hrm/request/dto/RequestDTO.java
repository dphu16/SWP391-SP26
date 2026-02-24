package com.project.hrm.request.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class RequestDTO {
    // 1. Dùng khi Employee Gửi yêu cầu
    private UUID employeeId;
    private String requestType; // "LEAVE", "OT", "SHIFT_CHANGE"
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;

    // 2. Dùng khi Manager Duyệt/Từ chối
    private String status; // Gửi "APPROVED" hoặc "REJECTED"
    private String managerComment;
}