package com.project.hrm.recruitment.service.impl;

import com.project.hrm.recruitment.dto.request.JobRequest;
import com.project.hrm.recruitment.dto.response.JobResponse;
import com.project.hrm.recruitment.service.JobService;

import java.util.List;
import java.util.UUID;

public class JobServiceImpl implements JobService {
    @Override
    public JobResponse create(JobRequest request) {
        return null;
    }

    @Override
    public List<JobResponse> getAllJob() {
        return List.of();
    }

    @Override
    public List<JobResponse> getJobByCreator(UUID id) {
        return List.of();
    }

    @Override
    public JobResponse getJobById(UUID id) {
        return null;
    }

    @Override
    public JobResponse update(UUID id, JobRequest request) {
        return null;
    }

    @Override
    public void delete(UUID id) {

    }
}
