package com.project.hrm.recruitment.dto.request;

import com.project.hrm.recruitment.enums.ReviewResult;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class CvReviewCreateRequest {

    @NotNull
    private UUID appId;

    @NotNull
    private UUID reviewerId;

    private BigDecimal score;

    @NotNull
    private ReviewResult result;

    private String comment;
}
