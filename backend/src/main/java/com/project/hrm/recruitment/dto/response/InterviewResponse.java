package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.InterviewStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class InterviewResponse {

    private UUID id;
    private InterviewStatus status;
    private OffsetDateTime scheduleTime;
    private BigDecimal rating;
    private String feedback;

    private UUID interviewerId;
    private String interviewerName;
}
