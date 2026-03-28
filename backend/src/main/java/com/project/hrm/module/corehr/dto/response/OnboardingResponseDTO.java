package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OnboardingResponseDTO {

    private UUID id;
    private UUID jobId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String jobTitle;
    private ApplicationStatus status;
    private ProgressStatus progressStatus;
    private String rejectionReason;
}