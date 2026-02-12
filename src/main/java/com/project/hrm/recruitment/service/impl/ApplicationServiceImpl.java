package com.project.hrm.recruitment.service.impl;

import com.project.hrm.recruitment.dto.request.CreateAppRequest;
import com.project.hrm.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.recruitment.enums.ApplicationStatus;
import com.project.hrm.recruitment.service.ApplicationService;

import java.util.List;
import java.util.UUID;

public class ApplicationServiceImpl implements ApplicationService {

    @Override
    public ApplicationResponse applyJob(CreateAppRequest request) {
        return null;
    }

    @Override
    public ApplicationResponse updateApplication(UUID appId, CreateAppRequest request) {
        return null;
    }

    @Override
    public ApplicationResponse updateStatus(UUID appId, ApplicationStatus status) {
        return null;
    }

    @Override
    public List<ApplicationResponse> getCandidateByJob(UUID jobId) {
        return List.of();
    }

    @Override
    public void deleteApplication(UUID appId) {

    }
}
