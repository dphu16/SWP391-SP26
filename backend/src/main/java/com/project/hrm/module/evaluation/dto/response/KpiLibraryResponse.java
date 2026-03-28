package com.project.hrm.module.evaluation.dto.response;

import com.project.hrm.module.evaluation.enums.KpiCategory;
import com.project.hrm.module.evaluation.enums.MeasurementType;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class KpiLibraryResponse {

    private UUID libId;
    private String name;
    private String description;
    private KpiCategory category;
    private Double defaultWeight;
    private MeasurementType measurementType;
}