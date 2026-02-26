package com.project.hrm.module.corehr.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class DepartmentResponse {
    private UUID deptId;
    private String deptName;
    private String description;
}
