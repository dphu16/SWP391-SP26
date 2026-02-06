package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserRole;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobDTO {
    private UserRole role;
    private String title;
    private String deptName;
    private Employee manager;
    private EmployeeStatus statusPos;
}
