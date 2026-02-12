package com.project.hrm.recruitment.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class EmployeeLookupResponse {
    private UUID id;
    private String fullName;
}

