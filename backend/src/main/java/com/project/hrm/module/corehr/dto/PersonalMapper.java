package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;

public class PersonalMapper {
    public static PersonalDTO toDTO(Employee employee) {
        return new PersonalDTO(
                employee.getUser().getUsername(),
                employee.getUser().getEmail(),
                employee.getPersonal().getPhone(),
                employee.getPersonal().getAddress(),
                employee.getUser().getStatus(),
                employee.getFullName(),
                employee.getPersonal().getGender(),
                employee.getPersonal().getCitizenId(),
                employee.getPersonal().getTaxCode(),
                employee.getPersonal().getDateOfBirth(),
                employee.getDateOfJoining()
        );
    }
}
