package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;

public class InactiveEmployeeMapper {

    private InactiveEmployeeMapper() {
    }
    public static InactiveEmployeeResponseDTO toDTO(Employee employee) {
        return InactiveEmployeeResponseDTO.builder()
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .fullName(employee.getFullName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .avatarUrl(employee.getAvatarUrl())
                .departmentName(
                        employee.getDepartment() != null
                                ? employee.getDepartment().getDeptName()
                                : null)
                .positionTitle(
                        employee.getPosition() != null
                                ? employee.getPosition().getTitle()
                                : null)
                .employeeStatus(employee.getStatusPos())
                .dateOfJoining(employee.getDateOfJoining())
                .build();
    }
}