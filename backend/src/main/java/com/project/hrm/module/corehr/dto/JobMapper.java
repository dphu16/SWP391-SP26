package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

public class JobMapper {
    public static JobDTO toDTO(Employee employee) {
        return new JobDTO(
                employee.getUser().getRole(),
                employee.getPosition().getTitle(),
                employee.getDepartment().getDeptName(),
                employee.getDepartment().getManager(),
                employee.getEmpStatus()
        );
    }
}
