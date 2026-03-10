package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

import java.util.stream.Collectors;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(Employee employee) {
        return new EmployeeDTO(
                employee.getPersonal().getAvatar(),
                employee.getFullName(),
                employee.getPersonal().getPhone(),
                employee.getPosition().getTitle(),
                employee.getUser() != null ? employee.getUser().getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()) : null,
                employee.getDepartment().getDeptName(),
                employee.getUser().getStatus()
                );
    }
}
