package com.project.hrm.recruitment.dto.request;

import com.project.hrm.recruitment.enums.JobStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class JobRequest {

    private UUID requestId;
    private String title;
    private String description;
    private String responsibility;
    private String requirement;
    private String benefit;
    private int quantity;
    private OffsetDateTime closedTime;
    private JobStatus status;

}
