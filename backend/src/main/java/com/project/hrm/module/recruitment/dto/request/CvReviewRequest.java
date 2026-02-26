package com.project.hrm.module.recruitment.dto.request;

import com.project.hrm.module.recruitment.enums.ResultStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class CvReviewRequest {

    private UUID appId;
    private UUID reviewerId;
    private double interviewScore;
    private String comment;
    private ResultStatus result;

}
