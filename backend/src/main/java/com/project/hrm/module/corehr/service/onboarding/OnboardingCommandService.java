package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.exception.ErrorCode;
import com.project.hrm.module.corehr.mapper.NewHireMapper;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import com.project.hrm.module.corehr.repository.RoleRepository;
import com.project.hrm.module.corehr.repository.UserRepository;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.corehr.enums.AuthProvider;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class OnboardingCommandService {

    private final EmployeeHelper employeeHelper;
    private final OnboardingRepository onboardingRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public OnboardingCommandService(EmployeeHelper employeeHelper,
            OnboardingRepository onboardingRepository,
            UserRepository userRepository,
            RoleRepository roleRepository) {
        this.employeeHelper = employeeHelper;
        this.onboardingRepository = onboardingRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    protected NewHireResponseDTO createNewHire(CreateNewHireDTO request) {
        Position position = employeeHelper.findPositionOrThrow(request.getPositionId());

        // Department is always derived from the Position's department (Job table source of truth).
        // If the Position has a department, use it; otherwise fall back to the DTO's departmentId.
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

        if (request.getMentorId() != null) {
            Employee mentor = employeeHelper.findEmployeeOrThrow(request.getMentorId());
            employee.setManager(mentor);
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            User newUser = User.builder()
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .avatarUrl(request.getAvatarUrl())
                    .status(UserStatus.INACTIVE)
                    .provider(AuthProvider.LOCAL)
                    .roles(new java.util.HashSet<>())
                    .build();

            if (request.getRole() != null) {
                roleRepository.findByName(request.getRole()).ifPresent(role -> {
                    newUser.getRoles().add(role);
                });
            }

            newUser.setEmployee(employee);
            userRepository.save(newUser);
            employee.setUser(newUser);
        }

        // Auto-generate employeeCode
        if (employee.getEmployeeCode() == null || employee.getEmployeeCode().isEmpty()) {
            employee.setEmployeeCode("EMP" + java.util.UUID.randomUUID().toString().substring(0, 3).toUpperCase());
        }

        Employee saved = employeeHelper.save(employee);

        if (request.getSourceApplicationId() != null) {
            onboardingRepository.deleteById(request.getSourceApplicationId());
        }

        return NewHireMapper.toResponseDTO(saved);
    }
}