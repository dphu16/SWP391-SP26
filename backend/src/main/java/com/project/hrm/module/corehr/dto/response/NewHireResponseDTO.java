
package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.corehr.enums.Gender;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    private String departmentName;

    private String positionTitle;

    private String citizenId;

    private String taxCode;

    private LocalDate dateOfBirth;

    private String avatarUrl;

    private EmployeeRole role;

    private ProgressStatus status;

    private String dependentName;

    private String relationship;

    private BigDecimal baseSalary;

}
