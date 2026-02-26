package com.project.hrm.module.payroll.dto.ResponseDTO;



import com.project.hrm.module.payroll.enums.InquiryStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InquiryResponseDTO {
    private UUID id;
    private String subject;
    private String message;
    private InquiryStatus status;     // OPEN, IN_PROGRESS...
    private String hrResponse;        // Câu trả lời từ HR
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    // Thông tin thêm để hiển thị context
    private UUID payslipId;
    private String payslipPeriod;     // Ví dụ "10/2023" để hiển thị cho dễ nhìn
}
