package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

import java.util.UUID;

@Data
public class CreateNewHireDTO {
    @NotBlank
    private String fullName;
    private String phone;
    private String email;
    private Gender gender;
    private String address;
    private String citizenId;
    private String taxCode;
    private LocalDate dateOfBirth;
    private String contractNumber;
    private LocalDate startDate;
    private String contractDuration; // 6_MONTHS, 1_YEAR, 2_YEARS, INDEFINITE, CUSTOM
    private LocalDate endDate;
    private EmployeeRole role;
    private EmployeeStatus status;
    private UUID departmentId;
    private UUID positionId;
    private UUID mentorId;
    private UUID sourceApplicationId;
    private String avatarUrl;
    private LocalDate dateOfJoining;
    private BigDecimal baseSalary;
    private String departmentName;
    private String positionName;
}
