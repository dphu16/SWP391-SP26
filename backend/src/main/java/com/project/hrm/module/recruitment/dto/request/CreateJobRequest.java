package com.project.hrm.module.recruitment.dto.request;

import com.project.hrm.module.recruitment.enums.JobStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CreateJobRequest {

    private UUID requestId;
    private String title;
    private String description;
    private String responsibility;
    private String requirement;
    private String benefit;
    private int quantity;
    private OffsetDateTime closedTime;
    private JobStatus status;
    private UUID hrId;

}
