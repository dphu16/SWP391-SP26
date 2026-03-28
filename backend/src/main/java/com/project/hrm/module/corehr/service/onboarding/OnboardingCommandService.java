package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.mapper.NewHireMapper;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.service.ApplicationService;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;
import com.project.hrm.module.request.repository.RequestRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class OnboardingCommandService {

    private final EmployeeHelper employeeHelper;
    private final OnboardingRepository onboardingRepository;
    private final ApplicationService applicationService;
    private final RequestRepository requestRepository;

    public OnboardingCommandService(EmployeeHelper employeeHelper, OnboardingRepository onboardingRepository,
            ApplicationService applicationService, RequestRepository requestRepository) {
        this.employeeHelper = employeeHelper;
        this.onboardingRepository = onboardingRepository;
        this.applicationService = applicationService;
        this.requestRepository = requestRepository;
    }

    @Transactional
    protected NewHireResponseDTO createNewHire(CreateNewHireDTO request) {
        Position position = employeeHelper.findPositionOrThrow(request.getPositionId());
        
        // Validate salary range
        employeeHelper.validateSalaryInPositionRange(position, request.getBaseSalary());

        Department department;
        if (position.getDepartment() != null) {
            department = position.getDepartment();
        } else {
            department = employeeHelper.findDepartmentOrThrow(request.getDepartmentId());
        }

        // Validate target status: must be one of OFFICIAL, INTERN, PROBATION
        Set<EmployeeStatus> allowedTargetStatuses = Set.of(
                EmployeeStatus.OFFICIAL, EmployeeStatus.INTERN, EmployeeStatus.PROBATION);
        if (request.getStatus() == null || !allowedTargetStatuses.contains(request.getStatus())) {
            throw new BusinessRuleException(
                    ErrorCode.INVALID_APPROVAL_ACTION,
                    "Target status must be one of: OFFICIAL, INTERN, PROBATION");
        }

        Employee employee = NewHireMapper.toEntity(request, department, position);
        employee.setEmpStatus(ProgressStatus.PENDING_REVIEW);
        employee.setStatus(request.getStatus());

        if (department != null) {
            employee.setManager(department.getManager());
            employee.setMentor(department.getMentor());
        }

        // Auto-generate employeeCode
        if (employee.getEmployeeCode() == null || employee.getEmployeeCode().isEmpty()) {
            employee.setEmployeeCode("EMP" + java.util.UUID.randomUUID().toString().substring(0, 3).toUpperCase());
        }

        Employee saved = employeeHelper.save(employee);

        // Auto-generate validation/approval request for manager
        Request requestEntity = Request.builder()
                .employeeId(saved.getEmployeeId())
                .requestType(RequestType.APPROVAL)
                .status(RequestStatus.PENDING)
                .build();
        requestRepository.save(requestEntity);

        if (request.getSourceApplicationId() != null) {
            applicationService.lastStage(request.getSourceApplicationId());
        }

        return NewHireMapper.toResponseDTO(saved);
    }
}