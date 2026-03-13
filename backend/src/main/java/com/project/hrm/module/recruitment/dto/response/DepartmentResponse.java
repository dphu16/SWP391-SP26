package com.project.hrm.module.recruitment.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class DepartmentResponse {
    private UUID deptId;
    private String deptName;
}
