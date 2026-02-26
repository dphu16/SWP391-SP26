package com.project.hrm.module.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KpiLibraryRequest {

    @NotBlank
    private String name;

    private String description;

    @NotBlank
    private String category;

    @NotNull
    private Double defaultWeight;
}