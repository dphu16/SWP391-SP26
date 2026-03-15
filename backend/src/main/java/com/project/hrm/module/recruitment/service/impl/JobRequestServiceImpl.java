package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.PositionRepository;
import com.project.hrm.module.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.module.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.module.recruitment.entity.JobRequest;
import com.project.hrm.module.recruitment.enums.RequestStatus;
import com.project.hrm.module.recruitment.repository.*;
import com.project.hrm.module.recruitment.service.JobRequestService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class JobRequestServiceImpl implements JobRequestService {

    private final JobRequestRepository jobRequestRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public JobRequestResponse create(JobRequestRequest request) {

        JobRequest entity = new JobRequest();

        return uploadData(entity, request);
    }

    @Override
    public List<JobRequestResponse> getAllRequest() {
        List<JobRequest> entities = jobRequestRepository.findAll();

        return entities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<JobRequestResponse> getRequestByDepartmentName(String name, RequestStatus status) {
        Sort sort = Sort.by(Sort.Order.desc("createdAt"));
        List<JobRequest> entities =
                jobRequestRepository.findByDept_DeptNameAndStatus(name, status, sort);

        return entities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<JobRequestResponse> getRequestByReportTo(UUID id, RequestStatus status) {
        Sort sort = Sort.by(Sort.Order.desc("createdAt"));
        List<JobRequest> entities =
                jobRequestRepository.findByReportsTo_EmployeeIdAndStatus(id, status, sort);

        return entities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<JobRequestResponse> getRequestByHr() {
        List<JobRequest> list = jobRequestRepository
                .findByStatusAndReportsToIsNull(RequestStatus.SUBMITTED);
        if (list.isEmpty()) return List.of();
        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<JobRequestResponse> choiceHr(UUID employeeId, List<UUID> ids) {
        List<JobRequest> list = jobRequestRepository.findAllById(ids);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Job request not found with id: " + employeeId));
        for(JobRequest i: list){
            i.setReportsTo(employee);
        }
        return list.stream()
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

        return uploadData(entity, request);
    }

    @Override
    public JobRequestResponse updateStatus(UUID id, RequestStatus status, String comment) {
        JobRequest entity = jobRequestRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job request not found with id: " + id));
        if (entity.getStatus().equals(RequestStatus.APPROVED) ||
                entity.getStatus().equals(RequestStatus.REJECTED)) {

            throw new IllegalStateException("Request already processed");
        }
        if (status == RequestStatus.REJECTED &&
                (comment == null || comment.isBlank())) {

            throw new IllegalArgumentException("Comment is required when rejecting");
        }
        entity.setStatus(status);

        if (comment != null) {
            entity.setHrComment(comment);
        }
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

    private JobRequestResponse uploadData(JobRequest entity, JobRequestRequest request){
        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        if (request.getDeptId() != null) {
            Department department = departmentRepository.findById(request.getDeptId())
                    .orElseThrow(() ->
                            new RuntimeException("Department not found"));
            entity.setDept(department);
        }

        if (request.getPosId() != null) {
            Position position = positionRepository.findById(request.getPosId())
                    .orElseThrow(() ->
                            new RuntimeException("Position not found"));
            entity.setPos(position);
        }

        entity.setQuantity(request.getQuantity());
        entity.setLocation(request.getLocation());
        entity.setType(request.getType());
        entity.setReason(request.getReason());
        entity.setStatus(RequestStatus.SUBMITTED);
        entity.setCreatedAt(OffsetDateTime.now());
        jobRequestRepository.save(entity);

        return mapToResponse(entity);
    }

    private JobRequestResponse mapToResponse(JobRequest entity) {

        JobRequestResponse response = new JobRequestResponse();

        response.setId(entity.getId());
        response.setPosId(entity.getPos().getPositionId());
        response.setPosName(entity.getPos().getTitle());
        response.setDeptId(entity.getDept().getDeptId());
        response.setDeptName(entity.getDept().getDeptName());
        response.setQuantity(entity.getQuantity());
        response.setLocation(entity.getLocation());

        // Fix 1: employmentType có thể null trong DB
        if (entity.getType() != null) {
            response.setType(entity.getType());
        }

        // Fix 2: status có thể null
        if (entity.getStatus() != null) {
            response.setStatus(entity.getStatus());
        }

        response.setReason(entity.getReason());

        // Fix 3: reportsTo có thể null (reviewer là optional)
        if (entity.getReportsTo() != null) {
            response.setReportTo(entity.getReportsTo().getEmployeeId());
            response.setReviewer(entity.getReportsTo().getFullName());
        }

        response.setComment(entity.getHrComment());

        return response;
    }
}
