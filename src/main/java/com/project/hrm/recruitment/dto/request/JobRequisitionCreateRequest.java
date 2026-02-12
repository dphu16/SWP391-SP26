package com.project.hrm.recruitment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class JobRequisitionCreateRequest {

    @NotBlank
    private String title;

    private Integer quantity;

    @NotNull
    private UUID departmentId;

    @NotNull
    private UUID positionId;
}
