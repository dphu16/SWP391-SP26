package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.ApplicationStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class ApplicationResponse {

    private UUID id;
    private ApplicationStatus status;
    private BigDecimal aiMatchScore;
    private OffsetDateTime appliedAt;

    private UUID candidateId;
    private String candidateName;

    private UUID reqId;
    private String jobTitle;
}
