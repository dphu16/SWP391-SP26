package com.project.hrm.recruitment.dto.request;

import com.project.hrm.recruitment.enums.ResultStatus;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CvReviewRequest {

    private UUID appId;
    private UUID reviewerId;
    private double intScore;
    private String comment;

}
