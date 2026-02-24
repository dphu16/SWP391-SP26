package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.Gender;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmployeeDetailDTO {

    // === Basic Information ===
    private UUID employeeId;
    private String employeeCode;
    private String avatarUrl;

    // === Personal Information ===
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String citizenId;
    private String taxCode;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;

    // === Job Information ===
    private UserRole role;
    private String positionTitle;
    private String deptName;
    private EmployeeStatus statusPos;

    // === Account Status ===
    private UserStatus status;
}
