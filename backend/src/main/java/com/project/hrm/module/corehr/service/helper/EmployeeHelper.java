package com.project.hrm.module.corehr.service.helper;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Dependent;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class EmployeeHelper {
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final DependentRepository dependentRepository;

    public EmployeeHelper(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository, PositionRepository positionRepository, DependentRepository dependentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.dependentRepository = dependentRepository;
    }

    public Employee save(Employee employee) {
        return employeeRepository.save(employee);
    }

    public Employee findEmployeeOrThrow(UUID id) {
        return employeeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    public Department findDepartmentOrThrow(UUID id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not avaiable: " + id));
    }

    public Position findPositionOrThrow(UUID id) {
        return positionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Position not avaiable: " + id));
    }

    public Dependent findDependentOrThrow(UUID id) {
        return dependentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dependent not avaiable: " + id));
    }
}
