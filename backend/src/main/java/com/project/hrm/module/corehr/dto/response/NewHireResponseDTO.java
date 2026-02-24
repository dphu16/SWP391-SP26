package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.Gender;
import com.project.hrm.module.corehr.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NewHireResponseDTO {

    private UUID employeeId;

    private String employeeCode;

    private String fullName;

    private String phone;

    private String email;

    private Gender gender;

    private String address;

    private UserRole role;

    private String departmentName;

    private String positionTitle;

    private String citizenId;

    private String taxCode;

    private LocalDate dateOfBirth;

    private String avatarUrl;

    private EmployeeStatus status;

    private OffsetDateTime createdAt;

    private String username;

    private String rawPassword;

    private String dependentName;

    private String relationship;

    private BigDecimal baseSalaryMin;

    private BigDecimal baseSalaryMax;
}
