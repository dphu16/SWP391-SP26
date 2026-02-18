package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.entity.User;

public class EmployeeDetailMapper {

    public static EmployeeDetailDTO toDTO(Employee employee) {
        User user = employee.getUser();
        Department department = employee.getDepartment();
        Position position = employee.getPosition();

        return EmployeeDetailDTO.builder()
                // Basic
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .avatarUrl(employee.getAvatarUrl())
                // Personal
                .fullName(employee.getFullName())
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : employee.getEmail())
                .phone(employee.getPhone())
                .address(employee.getAddress())
                .gender(employee.getGender())
                .citizenId(employee.getCitizenId())
                .taxCode(employee.getTaxCode())
                .dateOfBirth(employee.getDateOfBirth())
                .dateOfJoining(employee.getDateOfJoining())
                // Job
                .role(user != null ? user.getRole() : null)
                .positionTitle(position != null ? position.getTitle() : null)
                .deptName(department != null ? department.getDeptName() : null)
                .statusPos(employee.getStatusPos())
                // Account status
                .status(user != null ? user.getStatus() : null)
                .build();
    }
}
