package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.JobStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class JobRequisitionResponse {

    private UUID id;
    private String title;
    private Integer quantity;

    private UUID departmentId;
    private String departmentName;

    private UUID positionId;
    private String positionTitle;

    private JobStatus status;
    private OffsetDateTime createdAt;
}
