package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.PerformanceRuleResults;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PerformanceRuleResultsRequest {
    @NotNull(message = "reviewId is required")
    private UUID reviewId;

    @NotNull(message = "ruleId is required")
    private UUID ruleId;

    private BigDecimal resultScore;

    public PerformanceRuleResults toEntity(){
        PerformanceRuleResults result = new PerformanceRuleResults();
        result.setResultScore(this.resultScore);
        return result;
    }
}

