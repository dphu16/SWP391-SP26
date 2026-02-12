package com.project.hrm.recruitment.service.impl;

import com.project.hrm.recruitment.dto.request.JobRequest;
import com.project.hrm.recruitment.dto.response.JobResponse;
import com.project.hrm.recruitment.enums.JobStatus;
import com.project.hrm.recruitment.service.JobService;

import java.util.List;
import java.util.UUID;

public class JobServiceImpl implements JobService {
    @Override
    public JobResponse createJob(JobRequest request) {
        return null;
    }

    @Override
    public JobResponse getJobById(UUID id) {
        return null;
    }

    @Override
    public List<JobResponse> getAllJob() {
        return List.of();
    }

    @Override
    public List<JobResponse> getJobActive(JobStatus status) {
        return List.of();
    }

    @Override
    public JobResponse updateJob(UUID id, JobRequest request) {
        return null;
    }

    @Override
    public void deleteJob(UUID id) {

    }
}
