package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.Gender;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmployeeDetailDTO {
    private UUID employeeId;
    private String employeeCode;
    private String avatarUrl;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String citizenId;
    private String taxCode;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;
    private Set<String> roles;
    private String positionTitle;
    private UUID deptId;
    private String deptName;
    private EmployeeStatus statusEmp;
    private UserStatus status;
    private String contractNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String contractStatus;

    private String managerName;
    private String managerAvatar;
    private String mentorName;
    private String mentorAvatar;
}
