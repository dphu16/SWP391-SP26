package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.entity.*;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserStatus;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class EmployeeDetailMapper {

    private static Set<String> resolveRoles(Employee employee) {
        User user = employee.getUser();
        if (user != null && user.getRoles() != null) {
            return user.getRoles().stream()
                    .filter(role -> role != null && role.getName() != null)
                    .map(r -> r.getName().name())
                    .collect(Collectors.toSet());
        }

        return Collections.emptySet();
    }

    private static UserStatus resolveUserStatus(Employee employee) {
        User user = employee.getUser();
        if (user != null && user.getStatus() != null) {
            return user.getStatus();
        }

        EmployeeStatus employeeStatus = employee.getStatus();
        if (employeeStatus == null) {
            return null;
        }

        return switch (employeeStatus) {
            case OFFICIAL, INTERN, PROBATION -> UserStatus.ACTIVE;
            case TERMINATED, RESIGNED -> UserStatus.INACTIVE;
            default -> null;
        };
    }

    public static EmployeeDetailDTO toDTO(Employee employee) {
        User user = employee.getUser();
        Personal personal = employee.getPersonal();
        Department department = employee.getDepartment();
        Position position = employee.getPosition();
        Contract contract = employee.getContract();

        Employee manager = employee.getManager();
        Employee mentor = employee.getMentor();

        return EmployeeDetailDTO.builder()
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .avatarUrl(personal != null ? personal.getAvatar() : null)
                .fullName(employee.getFullName())
                .email(user != null && user.getEmail() != null ? user.getEmail()
                        : (personal != null ? personal.getEmail() : null))
                .phone(personal != null ? personal.getPhone() : null)
                .address(personal != null ? personal.getAddress() : null)
                .gender(personal != null ? personal.getGender() : null)
                .citizenId(personal != null ? personal.getCitizenId() : null)
                .taxCode(personal != null ? personal.getTaxCode() : null)
                .dateOfBirth(personal != null ? personal.getDateOfBirth() : null)
                .dateOfJoining(employee.getDateOfJoining())
                .roles(resolveRoles(employee))
                .positionTitle(position != null ? position.getTitle() : null)
                .deptName(department != null ? department.getDeptName() : null)
                .managerName(manager != null ? manager.getFullName() : null)
                .managerAvatar((manager != null && manager.getPersonal() != null) ? manager.getPersonal().getAvatar() : null)
                .mentorName(mentor != null ? mentor.getFullName() : null)
                .mentorAvatar((mentor != null && mentor.getPersonal() != null) ? mentor.getPersonal().getAvatar() : null)
                .statusEmp(employee.getStatus())
                .status(resolveUserStatus(employee))
                .contractNumber(contract != null ? contract.getContractNumber() : null)
                .startDate(contract != null ? contract.getStartDate() : null)
                .endDate(contract != null ? contract.getEndDate() : null)
                .contractStatus(contract != null ? contract.getStatus() : null)
                .build();
    }
}
