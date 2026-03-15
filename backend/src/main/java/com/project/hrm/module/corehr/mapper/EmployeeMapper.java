package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.EmployeeDTO;
import com.project.hrm.module.corehr.entity.Employee;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class EmployeeMapper {

    private EmployeeMapper() {
    }

    private static Set<String> resolveRoles(Employee employee) {
        if (employee.getUser() != null && employee.getUser().getRoles() != null
                && !employee.getUser().getRoles().isEmpty()) {
            return employee.getUser().getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());
        }

        return Collections.emptySet();
    }

    public static EmployeeDTO toDTO(Employee employee) {
        return new EmployeeDTO(

                employee.getEmployeeId(),
                employee.getEmployeeCode(),
                employee.getPersonal() != null ? employee.getPersonal().getAvatar() : null,
                employee.getFullName(),
                employee.getPersonal() != null ? employee.getPersonal().getPhone() : null,
                employee.getPosition() != null ? employee.getPosition().getTitle() : null,
                resolveRoles(employee),
                employee.getDepartment() != null ? employee.getDepartment().getDeptName() : null,
                employee.getStatus());
    }
}
