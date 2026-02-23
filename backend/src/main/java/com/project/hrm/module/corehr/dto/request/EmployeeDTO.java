package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class EmployeeDTO {
    private UUID id;
    private String employeeCode;
    private String avatarUrl;
    private String fullName;
    private String phone;
    private String positionTitle;
    private UserRole role;
    private String deptName;
    private UserStatus statusRole;
}
