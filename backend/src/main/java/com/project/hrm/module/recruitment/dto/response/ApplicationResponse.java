package com.project.hrm.module.recruitment.dto.response;

import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class ApplicationResponse {

    private UUID id;
    private UUID jobId;
    private String jobTitle;
    private UUID candidateId;
    private String fullName;
    private String email;
    private String phone;
    private String cvUrl;
    private ApplicationStatus status;

}
