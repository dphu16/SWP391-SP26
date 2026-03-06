package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.entity.JobRequest;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.repository.JobRequestRepository;
import com.project.hrm.module.recruitment.repository.REmployeeRepository;
import com.project.hrm.module.recruitment.service.JobService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final REmployeeRepository employeeRepository;
    private final JobRequestRepository jobRequestRepository;

    @Override
    public JobResponse create(CreateJobRequest request) {
        Job entity = new Job();
        entity.setId(UUID.randomUUID());
        addJobFromRequest(entity, request);
        jobRepository.save(entity);
        return mapToResponse(entity);
    }

    @Override
    public List<JobResponse> getAllJob() {
        List<Job> responses = jobRepository.findAll();
        return responses.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<JobResponse> getJobByEmployeeId(UUID id) {
        List<Job> responses = jobRepository.findByEmployee_EmployeeId(id);
        return responses.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public JobResponse getJobById(UUID id) {
        Job entity = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        return mapToResponse(entity);
    }

    @Override
    public List<JobResponse> getJobByStatus(String status) {
        List<Job> responses = jobRepository.findByStatus(status);
        return responses.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public JobResponse update(UUID id, CreateJobRequest request) {
        Job entity = jobRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job not found with id: " + id));
        addJobFromRequest(entity, request);
        return mapToResponse(entity);
    }

    @Override
    public JobResponse updateStatus(UUID id, JobStatus status) {

        Job entity = jobRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job not found with id: " + id));

        if (entity.getStatus().equals(JobStatus.CLOSED)) {
            throw new RuntimeException("Cannot update status of closed job");
        }

        entity.setStatus(status);

        if (status == JobStatus.CLOSED) {
            entity.setClosedAt(OffsetDateTime.now());
        }

        return mapToResponse(entity);
    }

    @Override
    public void delete(UUID id) {
        Job entity = jobRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job not found with id: " + id));

        jobRepository.delete(entity);
    }

    private void addJobFromRequest(Job entity, CreateJobRequest request) {
        Employee employee = employeeRepository.findById(request.getHrId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        if (request.getRequestId() != null) {
            JobRequest jobRequest = jobRequestRepository.findById(request.getRequestId())
                    .orElseThrow(() ->
                            new RuntimeException("Job Request not found"));

            entity.setRequest(jobRequest);
        }
        entity.setTitle(request.getTitle());
        entity.setQuantity(request.getQuantity());
        entity.setDescription(request.getDescription());
        entity.setResponsibilities(request.getResponsibility());
        entity.setRequirements(request.getRequirement());
        entity.setBenefits(request.getBenefit());
        entity.setClosedAt(request.getClosedTime());
        entity.setPostedAt(OffsetDateTime.now());
        entity.setStatus(request.getStatus());
        entity.setEmployee(employee);
        entity.setMaxCvQuantity(request.getMaxCv());
        entity.setSalary(request.getSalary());
    }

    private JobResponse mapToResponse(Job entity){
        JobResponse response = new JobResponse();
        response.setId(entity.getId());
        if(entity.getRequest()!=null) {
            response.setReqId(entity.getRequest().getId());
            response.setReqName(entity.getRequest().getJobTitle());
            response.setType(entity.getRequest().getEmploymentType());
            response.setLocation(entity.getRequest().getLocation());
        }
        response.setTitle(entity.getTitle());
        response.setQuantity(entity.getQuantity());
        response.setDescription(entity.getDescription());
        response.setResponsibility(entity.getResponsibilities());
        response.setRequirement(entity.getRequirements());
        response.setBenefit(entity.getBenefits());
        response.setClosedTime(entity.getClosedAt());
        response.setCreateAt(entity.getPostedAt());
        response.setStatus(entity.getStatus());
        response.setHrId(entity.getEmployee().getEmployeeId());
        response.setHrName(entity.getEmployee().getFullName());
        response.setMaxCv(entity.getMaxCvQuantity());
        response.setSalary(entity.getSalary());
        return response;
    }
}
