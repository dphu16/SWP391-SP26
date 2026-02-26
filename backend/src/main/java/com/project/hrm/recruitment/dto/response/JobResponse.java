package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.JobStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class JobResponse {

    private UUID id;
    private UUID reqId;
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

}
