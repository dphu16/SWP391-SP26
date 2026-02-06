package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(Employee employee) {
        return new EmployeeDTO(
                employee.getUser().getUsername(),
                employee.getUser().getRole(),
                employee.getUser().getStatus(),
                employee.getFullName(),
                employee.getPosition().getTitle(),
                employee.getStatusPos(),
                employee.getDateOfJoining());
    }
}
