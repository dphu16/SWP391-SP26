package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.enums.JobStatus;

import java.util.List;
import java.util.UUID;

public interface JobService {

    JobResponse create(CreateJobRequest request);
    List<JobResponse> getAllJob();
    List<JobResponse> getJobByEmployeeId(UUID id);
    JobResponse getJobById(UUID id);
    List<JobResponse> getJobByStatus(String status);
    JobResponse update(UUID id, CreateJobRequest request);
    JobResponse updateStatus(UUID id, JobStatus status);
    void delete(UUID id);

}
