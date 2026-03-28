package com.project.hrm.module.recruitment.dto.request;

import com.project.hrm.module.recruitment.enums.EmploymentType;
import com.project.hrm.module.recruitment.enums.JobStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CreateJobRequest {

    private UUID requestId;
    private UUID posId;
    private String description;
    private String responsibility;
    private String requirement;
    private String benefit;
    private int quantity;
    private OffsetDateTime postedTime;
    private OffsetDateTime closedTime;
    private JobStatus status;
    private UUID hrId;
    private int maxCv;
    private String location;
    private EmploymentType type;

}
