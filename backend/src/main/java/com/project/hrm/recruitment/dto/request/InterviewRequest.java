package com.project.hrm.recruitment.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class InterviewRequest {

    private UUID appId;
    private UUID interviewerId;
    private OffsetDateTime scheduleTime;

}
