package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.ResultStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CvResponse {

    private UUID id;
    private BigDecimal score;
    private ResultStatus resultStatus;
    private String comment;
    private OffsetDateTime reviewedAt;

    private UUID reviewerId;
    private String reviewerName;
}
