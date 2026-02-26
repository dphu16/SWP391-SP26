package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.EmploymentType;
import com.project.hrm.recruitment.enums.JobStatus;
import com.project.hrm.recruitment.enums.RequestStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class JobRequestResponse {

    private UUID id;
    private String title;
    private UUID deptId;
    private String deptName;
    private int quantity;
    private String location;
    private EmploymentType type;
    private UUID reportTo;
    private String reviewer;
    private String reason;
    private RequestStatus status;
    private String comment;

}
