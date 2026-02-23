package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.Gender;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class EmployeeChangeDTO {

    // === Personal Information ===
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String citizenId;
    private String taxCode;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;
    private String avatarUrl;

    // === Job Information ===
    private UUID departmentId;
    private UUID positionId;
    private UserRole role;
    private EmployeeStatus statusPos;

    // === Account Status ===
    private UserStatus status;
}
