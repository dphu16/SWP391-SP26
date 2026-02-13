package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.PerformanceReviews;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PerformanceReviewsRequest {
    @NotNull(message = "cycleId is required")
    private UUID cycleId;

    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    @NotNull(message = "managerId is required")
    private UUID managerId;

    private BigDecimal overallScore;
    private String status = "PENDING";

    public PerformanceReviews toEntity(){
        PerformanceReviews review = new PerformanceReviews();
        review.setOverallScore(this.overallScore);
        review.setStatus(this.status);
        return review;
    }
}

