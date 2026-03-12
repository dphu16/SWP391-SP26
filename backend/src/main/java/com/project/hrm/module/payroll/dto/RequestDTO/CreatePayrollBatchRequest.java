package com.project.hrm.module.payroll.dto.RequestDTO;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreatePayrollBatchRequest {

    @NotNull
    private UUID periodId;

    private String note;
}
