package com.project.hrm.module.corehr.dto.response;

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
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private UUID jobId;
    private String jobTitle;
    private String cvUrl;
    private ApplicationStatus status;
    private OffsetDateTime createdAt;
    private String onboardingStatus;
}