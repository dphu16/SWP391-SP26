package com.project.hrm.module.request.dto;

import com.project.hrm.module.request.enums.RequestType;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class RequestDTO {
    private UUID employeeId;
    private RequestType requestType; // Dùng Enum thay vì String
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;
    private String managerComment;
}