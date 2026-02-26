package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(Employee employee) {
        return new EmployeeDTO(
                employee.getAvatarUrl(),
                employee.getFullName(),
                employee.getPhone(),
                employee.getPosition().getTitle(),
                employee.getUser().getRole(),
                employee.getDepartment().getDeptName(),
                employee.getUser().getStatus()
                );
    }
}
