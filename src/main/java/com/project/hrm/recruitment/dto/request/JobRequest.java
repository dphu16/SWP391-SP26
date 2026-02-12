package com.project.hrm.recruitment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class JobRequest {

    private UUID requestId;
    private String title;
    private String description;
    private String responsibility;
    private String requirement;
    private String benefit;
    private int quantity;
    private OffsetDateTime closeTime;

}
