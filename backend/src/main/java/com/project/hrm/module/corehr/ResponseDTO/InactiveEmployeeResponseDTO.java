package com.project.hrm.module.corehr.ResponseDTO;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InactiveEmployeeResponseDTO {

    private UUID employeeId;
    private String employeeCode;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String departmentName;
    private String positionTitle;
    private EmployeeStatus employeeStatus;
    private LocalDate dateOfJoining;
}
