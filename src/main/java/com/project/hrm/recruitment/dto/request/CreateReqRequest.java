package com.project.hrm.recruitment.dto.request;

import com.project.hrm.recruitment.enums.EmploymentTypeStatus;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateReqRequest {
    private String jobTitle;
    private UUID deptId;
    private int quantity;
    private String location;
    private EmploymentTypeStatus empType;
    private UUID reportTo;
    private String reason;
}
