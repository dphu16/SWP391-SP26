package com.project.hrm.module.corehr.service.onboarding;

import com.project.hrm.module.corehr.dto.request.CreateNewHireDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import com.project.hrm.module.corehr.mapper.NewHireMapper;
import com.project.hrm.module.corehr.repository.OnboardingRepository;
import com.project.hrm.module.corehr.dto.response.NewHireResponseDTO;
import com.project.hrm.module.corehr.service.helper.EmployeeHelper;
import com.project.hrm.module.corehr.service.helper.PasswordGenerator;
import com.project.hrm.module.corehr.service.helper.UsernameGenerator;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class OnboardingCommandService {

    private final EmployeeHelper employeeHelper;
    private final UsernameGenerator usernameGenerator;
    private final PasswordGenerator passwordGenerator;
    private final PasswordEncoder passwordEncoder;
    private final OnboardingRepository onboardingRepository;

    public OnboardingCommandService(EmployeeHelper employeeHelper, UsernameGenerator usernameGenerator,
            PasswordGenerator passwordGenerator, PasswordEncoder passwordEncoder,
            OnboardingRepository onboardingRepository) {
        this.employeeHelper = employeeHelper;
        this.usernameGenerator = usernameGenerator;
        this.passwordGenerator = passwordGenerator;
        this.passwordEncoder = passwordEncoder;
        this.onboardingRepository = onboardingRepository;
    }

    @Transactional
    protected NewHireResponseDTO createNewHire(CreateNewHireDTO request) {
        Department department = employeeHelper.findDepartmentOrThrow(request.getDepartmentId());
        Position position = employeeHelper.findPositionOrThrow(request.getPositionId());

        Dependent dependent = null;
        if (request.getDependentName() != null && !request.getDependentName().isBlank()) {
            dependent = new Dependent();
            dependent.setFullName(request.getDependentName());
            dependent.setRelationship(request.getRelationship());
            dependent.setIsTaxDeductible(true);
        }

        String rawPassword = passwordGenerator.generate();
        String username = usernameGenerator.generateUnique(request.getFullName());

        User user = buildUser(username, rawPassword, request.getEmail());

        Employee employee = NewHireMapper.toEntity(request, department, position, dependent);
        employee.setUser(user);
        employee.setEmpStatus(EmployeeStatus.OFFICIAL);

        Employee saved = employeeHelper.save(employee);

        if (request.getSourceApplicationId() != null) {
            onboardingRepository.deleteById(request.getSourceApplicationId());
        }

        return NewHireMapper.toResponseDTO(saved, rawPassword);
    }

    private User buildUser(String username, String rawPassword, String email) {
        User user = new User();
        Employee employee = new Employee();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        employee.setEmail(email);
        user.setRole(UserRole.EMPLOYEE);
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

}
