package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class EmployeeDTO {
    private String username;
    private UserRole role;
    private UserStatus statusRole;
    private String fullName;
    private String positionTitle;
    private EmployeeStatus statusPos;
    private LocalDate dateOfJoining;
}
