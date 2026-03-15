package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingListResponseDTO;
import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.RoleRepository;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.corehr.mapper.OnboardingMapper;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.request.entity.Request;
import com.project.hrm.module.request.enums.RequestStatus;
import com.project.hrm.module.request.enums.RequestType;
import com.project.hrm.module.request.repository.RequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OnboardingService implements IOnboardingService {

    private final OnboardingRepository applicationRepository;
    private final EmployeeRepository employeeRepository;
    private final OnboardingCommandService onboaringCommandService;
    private final RequestRepository requestRepository;
    private final EmployeeHelper employeeHelper;
    private final RoleRepository roleRepository;

    public OnboardingService(OnboardingRepository applicationRepository,
            EmployeeRepository employeeRepository,
            OnboardingCommandService onboaringCommandService,
            RequestRepository requestRepository,
            EmployeeHelper employeeHelper,
            RoleRepository roleRepository) {
        this.applicationRepository = applicationRepository;
        this.employeeRepository = employeeRepository;
        this.onboaringCommandService = onboaringCommandService;
        this.requestRepository = requestRepository;
        this.employeeHelper = employeeHelper;
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingListResponseDTO getOnboardingList(Pageable pageable) {
        List<OnboardingResponseDTO> hiredApplications = applicationRepository
                .findByStatus(ApplicationStatus.HIRED, pageable)
                .map(OnboardingMapper::toDTO)
                .getContent();

        List<OnboardingResponseDTO> onboardingEmployees = employeeRepository
                .findByEmpStatusNot(ProgressStatus.COMPLETED)
                .stream()
                .map(emp -> {
                    String rejectionReason = null;
                    if (emp.getEmpStatus() == ProgressStatus.REJECTED) {
                        rejectionReason = requestRepository
                                .findTopByEmployeeIdAndRequestTypeAndStatusOrderByCreatedAtDesc(
                                        emp.getEmployeeId(), RequestType.APPROVAL, RequestStatus.REJECTED)
                                .map(r -> r.getManagerComment())
                                .orElse(null);
                    }
                    return OnboardingMapper.fromEmployee(emp, rejectionReason);
                })
                .collect(Collectors.toList());

        return OnboardingListResponseDTO.builder()
                .hiredApplications(hiredApplications)
                .onboardingEmployees(onboardingEmployees)
                .build();
    }

    @Override
    public NewHireResponseDTO createNewHire(CreateNewHireDTO request) {
        return onboaringCommandService.createNewHire(request);
    }

    @Override
    @Transactional(readOnly = true)
    public CreateNewHireDTO getEmployeeForEdit(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Employee not found with id: " + employeeId));

        if (employee.getEmpStatus() != ProgressStatus.REJECTED) {
            throw new BusinessRuleException(
                    ErrorCode.INVALID_APPROVAL_ACTION,
                    "Only rejected employees can be edited for resubmission");
        }

        Personal personal = employee.getPersonal();
        Contract contract = employee.getContract();

        CreateNewHireDTO dto = new CreateNewHireDTO();
        dto.setFullName(employee.getFullName());
        dto.setPhone(personal != null ? personal.getPhone() : null);
        dto.setEmail(personal != null ? personal.getEmail() : null);
        dto.setGender(personal != null ? personal.getGender(): null);
        dto.setAddress(personal != null ? personal.getAddress() : null);
        dto.setCitizenId(personal != null ? personal.getCitizenId() : null);
        dto.setTaxCode(personal != null ? personal.getTaxCode() : null);
        dto.setDateOfBirth(personal != null ? personal.getDateOfBirth() : null);
        dto.setAvatarUrl(personal != null ? personal.getAvatar() : null);
        dto.setDepartmentId(employee.getDepartment() != null ? employee.getDepartment().getDeptId() : null);
        dto.setPositionId(employee.getPosition() != null ? employee.getPosition().getPositionId() : null);
        dto.setMentorId(employee.getManager() != null ? employee.getManager().getEmployeeId() : null);
        dto.setDateOfJoining(employee.getDateOfJoining());
        if (employee.getUser() != null && employee.getUser().getRoles() != null) {
            dto.setRole(employee.getUser().getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse(null));
        }
        dto.setStatus(employee.getStatus());
        dto.setContractNumber(contract != null ? contract.getContractNumber() : null);
        dto.setContractType(contract != null ? contract.getContractType() : null);
        dto.setStartDate(contract != null ? contract.getStartDate() : null);
        dto.setEndDate(contract != null ? contract.getEndDate() : null);
        dto.setBaseSalary(contract != null ? contract.getBaseSalary() : null);

        return dto;
    }

    @Override
    @Transactional
    public void resubmitRejectedEmployee(UUID employeeId, CreateNewHireDTO updatedData) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.EMPLOYEE_NOT_FOUND,
                        "Employee not found with id: " + employeeId));

        if (employee.getEmpStatus() != ProgressStatus.REJECTED) {
            throw new BusinessRuleException(
                    ErrorCode.INVALID_APPROVAL_ACTION,
                    "Only rejected employees can be resubmitted");
        }

        // Update employee fields
        employee.setFullName(updatedData.getFullName());
        if (updatedData.getDepartmentId() != null) {
            employee.setDepartment(employeeHelper.findDepartmentOrThrow(updatedData.getDepartmentId()));
        }
        if (updatedData.getPositionId() != null) {
            employee.setPosition(employeeHelper.findPositionOrThrow(updatedData.getPositionId()));
        }
        if (updatedData.getMentorId() != null) {
            employee.setManager(employeeHelper.findEmployeeOrThrow(updatedData.getMentorId()));
        }
        employee.setDateOfJoining(updatedData.getDateOfJoining());

        // Update personal info
        Personal personal = employee.getPersonal();
        if (personal != null) {
            personal.setEmail(updatedData.getEmail());
            personal.setPhone(updatedData.getPhone());
            personal.setGender(updatedData.getGender());
            personal.setAddress(updatedData.getAddress());
            personal.setCitizenId(updatedData.getCitizenId());
            personal.setTaxCode(updatedData.getTaxCode());
            personal.setDateOfBirth(updatedData.getDateOfBirth());
            personal.setAvatar(updatedData.getAvatarUrl());
        }

        // Update contract info
        Contract contract = employee.getContract();
        if (contract != null) {
            contract.setContractNumber(updatedData.getContractNumber());
            contract.setContractType(updatedData.getContractType());
            contract.setStartDate(updatedData.getStartDate());
            contract.setEndDate(updatedData.getEndDate());
            contract.setBaseSalary(updatedData.getBaseSalary());
        }

        // Update user email if changed
        if (employee.getUser() != null && updatedData.getEmail() != null) {
            employee.getUser().setEmail(updatedData.getEmail());
            employee.getUser().setFullName(updatedData.getFullName());
            employee.getUser().setStatus(UserStatus.INACTIVE);
        }

        if (employee.getUser() != null && updatedData.getRole() != null) {
            Role mappedRole = roleRepository.findByName(updatedData.getRole())
                    .orElseThrow(() -> new BusinessRuleException(
                        ErrorCode.INVALID_APPROVAL_ACTION,
                            "Role không tồn tại: " + updatedData.getRole()));
            employee.getUser().setRoles(new HashSet<>(List.of(mappedRole)));
        }

        // Reset status for re-approval
        employee.setEmpStatus(ProgressStatus.PENDING_REVIEW);
        employee.setStatus(updatedData.getStatus() != null ? updatedData.getStatus() : EmployeeStatus.PROBATION);
        employeeRepository.save(employee);

        Request request = Request.builder()
                .employeeId(employeeId)
                .requestType(RequestType.APPROVAL)
                .status(RequestStatus.PENDING)
                .build();
        requestRepository.save(request);
    }
}
