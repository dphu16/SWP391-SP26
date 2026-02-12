package com.project.hrm.recruitment.dto.request;

import jakarta.validation.constraints.NotNull;
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
