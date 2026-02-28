package com.project.hrm.module.recruitment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ApplicationRequest {

    private UUID jobId;
    private String fullName;
    private String email;
    private String phone;
    private String cvUrl;

}
