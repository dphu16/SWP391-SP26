package com.project.hrm.recruitment.service;

import com.project.hrm.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.recruitment.enums.RequestStatus;

import java.util.List;
import java.util.UUID;

public interface JobRequestService {

    JobRequestResponse create(JobRequestRequest request); //Manager uses
    List<JobRequestResponse> getAllRequest();
    List<JobRequestResponse> getRequestByDepartmentId(UUID id); //Manager uses
    List<JobRequestResponse> getRequestByReportTo(UUID id); //HR uses
    JobRequestResponse getRequestById(UUID id); //Watch detail request
    JobRequestResponse update(UUID id, JobRequestRequest request); //Manager uses before HR review
    JobRequestResponse updateStatus(UUID id, RequestStatus status, String comment); //HR reviews
    void delete(UUID id); //Manager uses before HR review

}
