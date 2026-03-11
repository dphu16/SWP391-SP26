package com.project.hrm.module.recruitment.dto.request;

import com.project.hrm.module.recruitment.enums.InterviewStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class InterviewRequest {

    private UUID appId;
    private UUID interviewerId;
    private OffsetDateTime scheduleTime;
    private InterviewStatus status;
    private String feedback;
    private BigDecimal score;

}
