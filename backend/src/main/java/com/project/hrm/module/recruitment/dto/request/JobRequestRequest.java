package com.project.hrm.module.recruitment.dto.request;

import com.project.hrm.module.recruitment.enums.EmploymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class JobRequestRequest {

    private String title;
    private UUID deptId;
    private int quantity;
    private String location;
    private EmploymentType type;
    private UUID reportTo;
    private String reason;

}
