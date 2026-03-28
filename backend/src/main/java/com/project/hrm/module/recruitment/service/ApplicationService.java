package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.request.DateLimitRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;

import java.util.List;
import java.util.UUID;

public interface ApplicationService {
    ApplicationResponse create(ApplicationRequest request);
    ApplicationResponse getApplicationById(UUID id);
    List<ApplicationResponse> getAppByJobIdAndStatus(UUID id, ApplicationStatus status);
    ApplicationResponse update(UUID id, ApplicationRequest request);
    ApplicationResponse setDateLimit(DateLimitRequest request);
    List<ApplicationResponse> nextStage(List<UUID> ids);
    ApplicationResponse rejectStage(UUID id);
    ApplicationResponse lastStage(UUID id);
    List<ApplicationResponse> listAppsNoInterview(UUID jobId);
    List<ApplicationResponse> listAppsHaveInterview(UUID jobId);
    void delete(UUID id);

}
