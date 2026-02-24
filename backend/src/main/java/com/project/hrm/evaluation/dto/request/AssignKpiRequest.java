package com.project.hrm.evaluation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class AssignKpiRequest {
    @NotNull
    private UUID departmentId;
    
    private String structureName;
    
    private List<KpiDetailDto> details;
    
    @Data
    public static class KpiDetailDto {
        private UUID kpiLibraryId;
        private Double weight;
    }
}
