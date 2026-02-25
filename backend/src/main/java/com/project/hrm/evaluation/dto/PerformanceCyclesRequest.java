package com.project.hrm.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PerformanceCyclesRequest {
    @NotBlank(message = "cycleName is required")
    private String cycleName;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    @NotNull(message = "endDate is required")
    private LocalDate endDate;
}
