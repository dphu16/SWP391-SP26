package com.project.hrm.payroll.compensation.dto.RequestDTO;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateInquiryRequest {
    private UUID payslipId;
    private String subject;
    private String message;
}
