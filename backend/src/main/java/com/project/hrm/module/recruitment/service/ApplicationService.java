package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;

import java.util.List;
import java.util.UUID;

public interface ApplicationService {

    ApplicationResponse create(ApplicationRequest request);
    List<ApplicationResponse> getAllApplication();
    ApplicationResponse getApplicationById(UUID id);
    List<ApplicationResponse> getApplicationByJobId(UUID id);
    ApplicationResponse update(UUID id, ApplicationRequest request);
    void delete(UUID id);

}
