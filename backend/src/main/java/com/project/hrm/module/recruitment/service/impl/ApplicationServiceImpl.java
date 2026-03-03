package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.service.ApplicationService;

import java.util.List;
import java.util.UUID;

public class ApplicationServiceImpl implements ApplicationService {
    @Override
    public ApplicationResponse create(ApplicationRequest request) {
        return null;
    }

    @Override
    public List<ApplicationResponse> getAllApplication() {
        return List.of();
    }

    @Override
    public ApplicationResponse getApplicationById(UUID id) {
        return null;
    }

    @Override
    public List<ApplicationResponse> getApplicationByJobId(UUID id) {
        return List.of();
    }

    @Override
    public ApplicationResponse update(UUID id, ApplicationRequest request) {
        return null;
    }

    @Override
    public void delete(UUID id) {

    }
}
