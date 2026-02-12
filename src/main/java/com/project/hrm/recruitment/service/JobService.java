package com.project.hrm.recruitment.service;

import com.project.hrm.recruitment.dto.request.JobRequest;
import com.project.hrm.recruitment.dto.response.JobResponse;
import com.project.hrm.recruitment.enums.JobStatus;

import java.util.List;
import java.util.UUID;

public interface JobService {

    JobResponse createJob(JobRequest request);

    JobResponse getJobById(UUID id);

    List<JobResponse> getAllJob();

    List<JobResponse> getJobActive(JobStatus status);

    JobResponse updateJob(UUID id, JobRequest request);

    void deleteJob(UUID id);
}
