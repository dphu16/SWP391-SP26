package com.project.hrm.module.attendance.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class AttendanceEmployeeResponse {
    private UUID id;
    private String fullName;
    private String employeeCode;
    private String deptName;
}