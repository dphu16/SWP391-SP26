package com.project.hrm.recruitment.service;

import com.project.hrm.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.recruitment.dto.response.JobRequestResponse;

import java.util.List;
import java.util.UUID;

public interface JobRequestService {

    JobRequestResponse create(JobRequestRequest request);
    List<JobRequestResponse> getAllRequest();
    List<JobRequestResponse> getRequestByDepartmentId(UUID id);
    JobRequestResponse getRequestById(UUID id);
    JobRequestResponse update(UUID id, JobRequestRequest request);
    void delete(UUID id);

}
