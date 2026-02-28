package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

public class EmployeeMapper {
    public static EmployeeDTO toDTO(Employee employee) {
        return new EmployeeDTO(
                employee.getPersonal().getAvatar(),
                employee.getFullName(),
                employee.getPersonal().getPhone(),
                employee.getPosition().getTitle(),
                employee.getUser().getRole(),
                employee.getDepartment().getDeptName(),
                employee.getUser().getStatus()
                );
    }
}
