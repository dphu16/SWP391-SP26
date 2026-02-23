package com.project.hrm.evaluation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class KpiLibraryResponse {

    private UUID libId;
    private String name;
    private String description;
    private String category;
    private Double defaultWeight;
}