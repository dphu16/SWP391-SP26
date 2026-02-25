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
                .avatarUrl(employee.getPersonal() != null ? employee.getPersonal().getAvatar() : null)
                .fullName(employee.getPersonal() != null ? employee.getPersonal().getFullName() : null)
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : employee.getEmail())
                .phone(employee.getPersonal() != null ? employee.getPersonal().getPhone() : null)
                .address(employee.getPersonal() != null ? employee.getPersonal().getAddress() : null)
                .gender(employee.getPersonal() != null ? employee.getPersonal().getGender() : null)
                .citizenId(employee.getPersonal() != null ? employee.getPersonal().getCitizenId() : null)
                .taxCode(employee.getPersonal() != null ? employee.getPersonal().getTaxCode() : null)
                .dateOfBirth(employee.getPersonal() != null ? employee.getPersonal().getDateOfBirth() : null)
                .dateOfJoining(employee.getDateOfJoining())
                .role(user != null ? user.getRole() : null)
                .positionTitle(position != null ? position.getTitle() : null)
                .deptName(department != null ? department.getDeptName() : null)
                .statusPos(employee.getEmpStatus())
                .status(user != null ? user.getStatus() : null)
                .build();
    }
}
