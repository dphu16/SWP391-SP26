package com.project.hrm.module.recruitment.dto.response;

import com.project.hrm.module.recruitment.enums.EmploymentType;
import com.project.hrm.module.recruitment.enums.JobStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class JobResponse {

    private UUID id;
    private UUID reqId;
    private String reqName;
    private EmploymentType type;
    private String location;
    private String title;
    private String description;
    private String responsibility;
    private String requirement;
    private String benefit;
    private int quantity;
    private JobStatus status;
    private OffsetDateTime closedTime;
    private OffsetDateTime createAt;
    private UUID hrId;
    private String hrName;
    private int maxCv;
    private String salary;

}
