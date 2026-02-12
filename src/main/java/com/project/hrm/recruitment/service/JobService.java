package com.project.hrm.recruitment.service;

import com.project.hrm.recruitment.dto.request.JobRequest;
import com.project.hrm.recruitment.dto.response.JobResponse;

import java.util.List;
import java.util.UUID;

public interface JobService {

    JobResponse create(JobRequest request);
    List<JobResponse> getAllJob();
    List<JobResponse> getJobByCreator(UUID id);
    JobResponse getJobById(UUID id);
    JobResponse update(UUID id, JobRequest request);
    void delete(UUID id);

}
