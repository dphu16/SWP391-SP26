package com.project.hrm.recruitment.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class DepartmentLookupResponse {
    private UUID id;
    private String deptName;
}
