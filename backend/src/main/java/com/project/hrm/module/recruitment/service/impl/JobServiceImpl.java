package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.entity.JobDetail;
import com.project.hrm.module.recruitment.entity.JobRequest;
import com.project.hrm.module.recruitment.enums.EmploymentType;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.repository.*;
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
    private final JobDetailRepository jobDetailRepository;
    private final REmployeeRepository REmployeeRepository;
    private final RPositionRepository RPositionRepository;
    private final JobRequestRepository jobRequestRepository;

    @Override
    public JobResponse create(CreateJobRequest request) {
        Job entity = new Job();
        JobDetail jobDetail = new JobDetail();
        createJobDetail(jobDetail, request);
        entity.setJobDetail(jobDetail);
        addJobFromRequest(entity, request);
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
    public List<JobResponse> getJobByStatus(JobStatus status) {
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
        JobDetail jobDetail = entity.getJobDetail();
        createJobDetail(jobDetail, request);
        entity.setJobDetail(jobDetail);
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

    private void createJobDetail(JobDetail entity, CreateJobRequest request){
        entity.setQuantity(request.getQuantity());
        entity.setMaxCv(request.getMaxCv());
        entity.setLocation(request.getLocation());
        entity.setDescription(request.getDescription());
        entity.setRequirements(request.getRequirement());
        entity.setResponsibilities(request.getResponsibility());
        entity.setBenefits(request.getBenefit());
        entity.setType(EmploymentType.PROBATION);
        entity.setCreatedAt(OffsetDateTime.now());
        jobDetailRepository.save(entity);
    }

    private void addJobFromRequest(Job entity, CreateJobRequest request) {
        if (request.getRequestId() != null) {
            JobRequest jobRequest = jobRequestRepository.findById(request.getRequestId())
                    .orElseThrow(() ->
                            new RuntimeException("Job Request not found"));

            entity.setRequest(jobRequest);
            entity.setPos(jobRequest.getPos());
            entity.setEmployee(jobRequest.getReportsTo());
        } else{
            Employee employee = REmployeeRepository.findById(request.getHrId())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            Position position = RPositionRepository.findById(request.getPosId())
                    .orElseThrow(() -> new RuntimeException("Position not found"));
            entity.setEmployee(employee);
            entity.setPos(position);
        }
        entity.setClosedAt(request.getClosedTime());
        entity.setPostedAt(request.getPostedTime());
        entity.setStatus(request.getStatus());
        jobRepository.save(entity);
    }

    private JobResponse mapToResponse(Job entity){
        JobResponse response = new JobResponse();
        response.setId(entity.getId());
        if(entity.getRequest()!=null) {
            response.setReqId(entity.getRequest().getId());
        }
        JobDetail jobDetail = entity.getJobDetail();
        response.setQuantity(jobDetail.getQuantity());
        response.setDescription(jobDetail.getDescription());
        response.setResponsibility(jobDetail.getResponsibilities());
        response.setRequirement(jobDetail.getRequirements());
        response.setBenefit(jobDetail.getBenefits());
        response.setClosedTime(entity.getClosedAt());
        response.setPostedAt(entity.getPostedAt());
        response.setStatus(entity.getStatus());
        response.setHrId(entity.getEmployee().getEmployeeId());
        response.setHrName(entity.getEmployee().getFullName());
        response.setMaxCv(jobDetail.getMaxCv());
        response.setType(jobDetail.getType());
        response.setLocation(jobDetail.getLocation());
        Position position = entity.getPos();
        response.setDeptId(position.getDepartment().getDeptId());
        response.setDeptName(position.getDepartment().getDeptName());
        response.setPosId(position.getPositionId());
        response.setPosName(position.getTitle());
        response.setMinSalary(position.getBaseSalaryMin());
        response.setMaxSalary(position.getBaseSalaryMax());
        return response;
    }
}
