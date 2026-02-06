package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobDTO {
    private UserRole role;
    private String title;
    private String deptName;
    private Employee managerName;
    private EmployeeStatus statusPos;
}
