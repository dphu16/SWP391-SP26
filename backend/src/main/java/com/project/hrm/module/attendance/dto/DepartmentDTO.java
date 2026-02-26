package com.project.hrm.module.attendance.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DepartmentDTO {
    private UUID deptId;
    private String deptName;
}