package com.project.hrm.module.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EmployeeGoalRequest {
    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    @NotNull(message = "cycleId is required")
    private UUID cycleId;

    @NotNull(message = "kpiLibraryId is required")
    private UUID kpiLibraryId;

    @NotBlank(message = "title is required")
    private String title;

    private Double targetValue;
    private Double weight;

    private UUID assignedBy;
}
