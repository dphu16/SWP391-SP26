package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
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
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .avatarUrl(employee.getPersonal().getAvatar())
                .fullName(employee.getPersonal().getFullName())
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : employee.getEmail())
                .phone(employee.getPersonal().getPhone())
                .address(employee.getPersonal().getAddress())
                .gender(employee.getPersonal().getGender())
                .citizenId(employee.getPersonal().getCitizenId())
                .taxCode(employee.getPersonal().getTaxCode())
                .dateOfBirth(employee.getPersonal().getDateOfBirth())
                .dateOfJoining(employee.getDateOfJoining())
                .role(user != null ? user.getRole() : null)
                .positionTitle(position != null ? position.getTitle() : null)
                .deptName(department != null ? department.getDeptName() : null)
                .statusPos(employee.getEmpStatus())
                .status(user != null ? user.getStatus() : null)
                .build();
    }
}
