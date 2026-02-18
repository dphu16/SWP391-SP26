package com.project.hrm.module.recruitment.dto;

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
public class ApplicationResponseDTO {

    private UUID id;

    // === Candidate Info ===
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;

    // === Job Info ===
    private UUID jobId;
    private String jobTitle;

    // === Application Info ===
    private String cvUrl;
    private ApplicationStatus status;
    private OffsetDateTime createdAt;

    // === Onboarding Info ===
    private String onboardingStatus; // PENDING, IN_PROGRESS, COMPLETED
}
