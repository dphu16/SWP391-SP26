package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.ResponseDTO.OnboardingResponseDTO;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.recruitment.entity.Job;

public class OnboardingMapper {

    /**
     * Chuyển Application entity sang DTO.
     * Null-safe cho các quan hệ Candidate và Job.
     * Set mặc định onboardingStatus là PENDING.
     */
    public static OnboardingResponseDTO toDTO(Application application) {
        Candidate candidate = application.getCandidate();
        Job job = application.getJob();

        return OnboardingResponseDTO.builder()
                .id(application.getId())
                // Candidate
                .candidateName(candidate != null ? candidate.getFullName() : null)
                .candidateEmail(candidate != null ? candidate.getEmail() : null)
                .candidatePhone(candidate != null ? candidate.getPhone() : null)
                // Job
                .jobId(job != null ? job.getId() : null)
                .jobTitle(job != null ? job.getTitle() : null)
                // Application
                .cvUrl(application.getCvUrl())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                // Onboarding - Set mặc định là PENDING
                .onboardingStatus("PENDING")
                .build();
    }
}
