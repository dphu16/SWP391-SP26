package com.project.hrm.recruitment.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class CandidateResponse {

    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String cvUrl;
    private OffsetDateTime createdAt;
}
