package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.ResultStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CvReviewResponse {

    private UUID id;
    private UUID appId;
    private UUID reviewerId;
    private String reviewerName;
    private double interviewScore;
    private String comment;
    private ResultStatus result;

}
