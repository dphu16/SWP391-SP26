package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.entity.ReviewDetails;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ReviewDetailsRequest {
    @NotNull(message = "reviewId is required")
    private UUID reviewId;

    @NotNull(message = "goalId is required")
    private UUID goalId;

    private BigDecimal score;
    private String comment;

    public ReviewDetails toEntity(){
        ReviewDetails detail = new ReviewDetails();
        detail.setScore(this.score);
        detail.setComment(this.comment);
        return detail;
    }
}

