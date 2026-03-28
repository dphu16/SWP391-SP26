package com.project.hrm.module.corehr.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ActivationResponseDTO {
    private String message;
    private String employeeName;
    private String email;
    private String currentStep;
    private UUID employeeId;
}
