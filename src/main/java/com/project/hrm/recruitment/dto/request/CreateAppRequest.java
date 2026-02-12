package com.project.hrm.recruitment.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateAppRequest {

    private UUID jobId;
    private String fullName;
    @Email
    private String email;
    private String phone;
    private String cvUrl;

}
