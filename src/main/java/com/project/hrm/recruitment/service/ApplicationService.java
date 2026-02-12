package com.project.hrm.recruitment.service;

import com.project.hrm.recruitment.dto.request.CreateAppRequest;
import com.project.hrm.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.recruitment.enums.ApplicationStatus;

import java.util.List;
import java.util.UUID;

public interface ApplicationService {

    ApplicationResponse applyJob(CreateAppRequest request);

    ApplicationResponse updateApplication(UUID appId, CreateAppRequest request);

    ApplicationResponse updateStatus(UUID appId, ApplicationStatus status);

    List<ApplicationResponse> getCandidateByJob(UUID jobId);

    void deleteApplication(UUID appId);
}
