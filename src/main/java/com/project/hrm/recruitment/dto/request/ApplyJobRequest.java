package com.project.hrm.recruitment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ApplyJobRequest {

    @NotNull
    private UUID reqId;

    @NotNull
    private UUID candidateId;
}
