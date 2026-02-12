package com.project.hrm.recruitment.service.impl;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.recruitment.dto.request.CreateReqRequest;
import com.project.hrm.recruitment.dto.response.RequestResponse;
import com.project.hrm.recruitment.dto.response.RequestTitleResponse;
import com.project.hrm.recruitment.entity.JobRequest;
import com.project.hrm.recruitment.enums.EmploymentTypeStatus;
import com.project.hrm.recruitment.enums.RequestStatus;
import com.project.hrm.recruitment.repository.DepartmentRRepository;
import com.project.hrm.recruitment.repository.EmployeeRRepository;
import com.project.hrm.recruitment.repository.RequestRepository;
import com.project.hrm.recruitment.service.RequestService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;
    private final EmployeeRRepository employeeRRepository;
    private final DepartmentRRepository departmentRRepository;

    public RequestServiceImpl(RequestRepository requestRepository,
                              EmployeeRRepository employeeRRepository,
                              DepartmentRRepository departmentRRepository){
        this.requestRepository = requestRepository;
        this.employeeRRepository = employeeRRepository;
        this.departmentRRepository = departmentRRepository;
    }

    @Override
    public RequestResponse createRequest(CreateReqRequest request) {
        Employee reportTo = employeeRRepository
                .findByEmployeeId(request.getReportTo())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        Department department = request.getDeptId() == null
                ? null
                : departmentRRepository.findDepartmentByDeptId(request.getDeptId())
                .orElse(null);

        JobRequest entity = new JobRequest();
        entity.setId(UUID.randomUUID());
        entity.setJobTitle(request.getJobTitle());
        entity.setDept(department);
        entity.setQuantity(request.getQuantity());
        entity.setReason(request.getReason());
        entity.setLocation(request.getLocation());
        entity.setEmploymentType(request.getEmpType().name());
        entity.setReportsTo(reportTo);
        entity.setStatus(RequestStatus.SUBMITTED.name());
        entity.setCreatedAt(OffsetDateTime.now());
        return mapToResponse(requestRepository.save(entity));
    }

    @Override
    public RequestResponse getRequestById(UUID requestId) {

        JobRequest entity = requestRepository.findById(requestId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Job request not found with id: " + requestId
                        )
                );

        return mapToResponse(entity);
    }

    @Override
    public List<RequestResponse> getAllRequest() {
        List<JobRequest> request = requestRepository.findAll();

        return request.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<RequestTitleResponse> getRequestByReportTo(UUID hrId) {
        return List.of();
    }

    @Override
    public RequestResponse updateRequest(UUID requestId, CreateReqRequest request) {
//        Employee reportTo = employeeRRepository
//                .findByEmployeeId(request.getReportTo())
//                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        return null;
    }

    @Override
    public void deleteRequest(UUID requestId) {
        if (!requestRepository.existsById(requestId)) {
            throw new RuntimeException("Request not found with id: " + requestId);
        }
        requestRepository.deleteById(requestId);
    }

    private RequestResponse mapToResponse(JobRequest entity) {

        RequestResponse res = new RequestResponse();

        res.setRequestId(entity.getId());

        if (entity.getDept() != null) {
            res.setDeptId(entity.getDept().getDeptId());
            res.setDeptName(entity.getDept().getDeptName());
        }
        res.setJobTitle(entity.getJobTitle());
        res.setQuantity(entity.getQuantity());
        res.setLocation(entity.getLocation());
        res.setEmpType(EmploymentTypeStatus.valueOf(entity.getEmploymentType()));
        res.setReportTo(entity.getReportsTo().getEmployeeId());
        res.setReviewer(entity.getReportsTo().getFullName());
        res.setReason(entity.getReason());

        res.setStatus(RequestStatus.valueOf(entity.getStatus()));
        res.setCreateAt(entity.getCreatedAt());

        return res;
    }
}
