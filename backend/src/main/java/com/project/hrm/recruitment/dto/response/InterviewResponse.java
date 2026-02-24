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
    private UUID appId;
    private UUID interviewerId;
    private String interviewerName;
    private OffsetDateTime scheduleTime;
    private InterviewStatus status;
    private String feedback;

}
