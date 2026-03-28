package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.module.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.module.recruitment.enums.RequestStatus;

import java.util.List;
import java.util.UUID;

public interface JobRequestService {

    JobRequestResponse create(JobRequestRequest request); //Manager uses
    List<JobRequestResponse> getAllRequest();
    List<JobRequestResponse> getRequestByDepartmentName(String name, RequestStatus status); //Manager uses
    List<JobRequestResponse> getRequestByReportTo(UUID id, RequestStatus status); //HR uses
    List<JobRequestResponse> getRequestByHr();
    List<JobRequestResponse> choiceHr(UUID employeeId, List<UUID> ids);
    JobRequestResponse getRequestById(UUID id); //Watch detail request
    JobRequestResponse update(UUID id, JobRequestRequest request); //Manager uses before HR review
    JobRequestResponse updateStatus(UUID id, RequestStatus status, String comment); //HR reviews
    void delete(UUID id); //Manager uses before HR review

}
