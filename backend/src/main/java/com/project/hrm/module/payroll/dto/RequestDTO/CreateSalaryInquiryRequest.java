package com.project.hrm.module.payroll.dto.RequestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/** Employee tạo thắc mắc về phiếu lương */
@Data
public class CreateSalaryInquiryRequest {

    @NotNull
    private UUID payslipId;

    @NotBlank
    private String subject;

    @NotBlank
    private String message;
}
