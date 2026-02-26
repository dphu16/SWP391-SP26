package com.project.hrm.payroll.compensation.dto.RequestDTO;

import jakarta.validation.constraints.Max;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;

@Getter
@Setter
public class CreatePeriodRequest {
    @NotNull
    @Min(1) @Max(12)
    private Integer month;
    @NotNull
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
}
