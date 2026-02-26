package com.project.hrm.module.evaluation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GlobalPerformanceStatsResponse {
    private Double orgAverageScore;
    private Double totalKpiTargetValue;
}
