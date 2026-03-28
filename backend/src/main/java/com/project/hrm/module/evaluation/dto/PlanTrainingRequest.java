package com.project.hrm.module.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class PlanTrainingRequest {
    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    @NotNull(message = "reviewId is required")
    private UUID reviewId;

    @NotBlank(message = "courseName is required")
    private String courseName;

    @NotBlank(message = "courseUrl is required")
    private String courseUrl;

    private String platform = "COURSERA";

    @NotNull(message = "deadline is required")
    private LocalDate deadline;

    @NotBlank(message = "reason is required")
    private String reason;
}
