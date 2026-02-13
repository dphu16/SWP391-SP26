package com.project.hrm.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.recruitment.entity.JobRequest;
import com.project.hrm.recruitment.enums.EmploymentType;
import com.project.hrm.recruitment.enums.RequestStatus;
import com.project.hrm.recruitment.repository.JobRequestRepository;
import com.project.hrm.recruitment.repository.RDepartmentRepository;
import com.project.hrm.recruitment.repository.REmployeeRepository;
import com.project.hrm.recruitment.service.JobRequestService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class JobRequestServiceImpl implements JobRequestService {

    private final JobRequestRepository jobRequestRepository;
    private final RDepartmentRepository departmentRepository;
    private final REmployeeRepository employeeRepository;

    @Override
    public JobRequestResponse create(JobRequestRequest request) {
        Department department = departmentRepository.findById(request.getDeptId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Employee reviewer = null;
        if (request.getReportTo() != null) {
            reviewer = employeeRepository.findById(request.getReportTo())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
        }

        JobRequest entity = new JobRequest();
        entity.setId(UUID.randomUUID());
        entity.setJobTitle(request.getTitle());
        entity.setDept(department);
        entity.setQuantity(request.getQuantity());
        entity.setLocation(request.getLocation());
        entity.setEmploymentType(request.getType().name());
        entity.setReportsTo(reviewer);
        entity.setReason(request.getReason());
        entity.setStatus(RequestStatus.SUBMITTED.name());
        entity.setCreatedAt(OffsetDateTime.now());

        jobRequestRepository.save(entity);

        return mapToResponse(entity);
    }

    @Override
    public List<JobRequestResponse> getAllRequest() {
        List<JobRequest> entities = jobRequestRepository.findAll();

        return entities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<JobRequestResponse> getRequestByDepartmentId(UUID id) {
        List<JobRequest> entities =
                jobRequestRepository.findByDept_DeptId(id);

        return entities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public JobRequestResponse getRequestById(UUID id) {
        JobRequest entity = jobRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job request not found with id: " + id));

        return mapToResponse(entity);
    }

    @Override
    public JobRequestResponse update(UUID id, JobRequestRequest request) {
        JobRequest entity = jobRequestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job request not found with id: " + id));

        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        if (request.getDeptId() != null) {
            Department department = departmentRepository.findById(request.getDeptId())
                    .orElseThrow(() ->
                            new RuntimeException("Department not found"));
            entity.setDept(department);
        }

        if (request.getReportTo() != null) {
            Employee reviewer = employeeRepository.findById(request.getReportTo())
                    .orElseThrow(() ->
                            new RuntimeException("Employee not found"));
            entity.setReportsTo(reviewer);
        }

        entity.setJobTitle(request.getTitle());
        entity.setQuantity(request.getQuantity());
        entity.setLocation(request.getLocation());
        entity.setEmploymentType(request.getType().name());
        entity.setReason(request.getReason());

        JobRequest updated = jobRequestRepository.save(entity);

        return mapToResponse(updated);
    }

    @Override
    public void delete(UUID id) {
        JobRequest entity = jobRequestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job request not found with id: " + id));

        jobRequestRepository.delete(entity);
    }

    private JobRequestResponse mapToResponse(JobRequest entity) {

        JobRequestResponse response = new JobRequestResponse();

        response.setId(entity.getId());
        response.setTitle(entity.getJobTitle());
        response.setDeptId(entity.getDept().getDeptId());
        response.setDeptName(entity.getDept().getDeptName());
        response.setQuantity(entity.getQuantity());
        response.setLocation(entity.getLocation());
        response.setType(EmploymentType.valueOf(entity.getEmploymentType()));
        response.setReason(entity.getReason());
        response.setStatus(RequestStatus.valueOf(entity.getStatus()));
        response.setReportTo(entity.getReportsTo().getEmployeeId());
        response.setReviewer(entity.getReportsTo().getFullName());

        return response;
    }

}
