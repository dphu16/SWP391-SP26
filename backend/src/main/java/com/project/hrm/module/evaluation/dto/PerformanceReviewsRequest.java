package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PerformanceReviewsRequest {

    @NotNull(message = "cycleId is required")
    private UUID cycleId;

    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    @NotNull(message = "managerId is required")
    private UUID managerId;

    private Double kpiScore;
    private Double attitudeScore;

    private ReviewStatus status;

}

