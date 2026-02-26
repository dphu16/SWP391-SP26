package com.project.hrm.module.payroll.dto.RequestDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateInquiryRequest {
    // Optional: Nhân viên có thể thắc mắc chung chung hoặc thắc mắc về 1 phiếu lương cụ thể
    private UUID payslipId;

    @NotBlank(message = "Subject cannot be empty")
    private String subject;

    @NotBlank(message = "Message cannot be empty")
    private String message;
}
