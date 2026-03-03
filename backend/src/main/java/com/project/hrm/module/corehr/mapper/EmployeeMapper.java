package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.entity.Employee;

public class EmployeeMapper {

    private EmployeeMapper() {
    }

    public static EmployeeDTO toDTO(Employee employee) {
        return new EmployeeDTO(

                employee.getEmployeeId(),
                employee.getEmployeeCode(),
                employee.getPersonal().getAvatar(),
                employee.getFullName(),
                employee.getPersonal().getPhone(),
                employee.getPosition() != null ? employee.getPosition().getTitle() : null,
                employee.getUser() != null ? employee.getUser().getRole() : null,
                employee.getDepartment() != null ? employee.getDepartment().getDeptName() : null,
                employee.getUser() != null ? employee.getUser().getStatus() : null);
    }
}
