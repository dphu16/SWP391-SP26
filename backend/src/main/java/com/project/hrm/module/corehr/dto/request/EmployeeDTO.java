package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;
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
    private Set<String> roles;
    private String deptName;
    private EmployeeStatus statusEmp;
}
