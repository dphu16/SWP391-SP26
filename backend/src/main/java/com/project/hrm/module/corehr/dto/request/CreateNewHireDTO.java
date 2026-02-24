package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateNewHireDTO {
    @NotBlank
    private String fullName;

    private String phone;

    @Email
    private String email;

    private Gender gender;

    private String address;

    @NotNull
    private UUID departmentId;

    @NotNull
    private UUID positionId;

    private String citizenId;

    private String taxCode;

    private LocalDate dateOfBirth;

    private String avatarUrl;

    private UUID sourceApplicationId;

    private UUID managerId;

    private String dependentName;

    private String relationship;

    @NotNull
    private BigDecimal baseSalaryMin;

    @NotNull
    private BigDecimal baseSalaryMax;
}
