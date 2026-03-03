package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.enums.KpiCategory;
import com.project.hrm.module.evaluation.enums.MeasurementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class KpiLibraryRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private KpiCategory category;

    @NotNull
    private Double defaultWeight;

    private MeasurementType measurementType;

    private UUID departmentId;
}