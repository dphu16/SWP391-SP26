package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

public class PersonalMapper {
    public static PersonalDTO toDTO(Employee employee) {
        return new PersonalDTO(
                employee.getUser().getUsername(),
                employee.getUser().getEmail(),
                employee.getPhone(),
                employee.getAddress(),
                employee.getUser().getStatus(),
                employee.getFullName(),
                employee.getGender(),
                employee.getCitizenId(),
                employee.getTaxCode(),
                employee.getDateOfBirth(),
                employee.getDateOfJoining()
        );
    }
}
