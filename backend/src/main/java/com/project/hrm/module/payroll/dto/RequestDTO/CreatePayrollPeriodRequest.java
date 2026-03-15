package com.project.hrm.module.payroll.dto.RequestDTO;

import jakarta.validation.constraints.*;
import lombok.Data;


@Data
public class CreatePayrollPeriodRequest {

    @NotNull @Min(1) @Max(12)
    private Integer month;

    @NotNull @Min(2000)
    private Integer year;

}
