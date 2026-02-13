package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.PerformanceRules;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PerformanceRulesRequest {
    @NotBlank(message = "ruleName is required")
    private String ruleName;

    private String description;
    private String condition;
    private BigDecimal score;

    public PerformanceRules toEntity(){
        PerformanceRules rule = new PerformanceRules();
        rule.setRuleName(this.ruleName);
        rule.setDescription(this.description);
        rule.setCondition(this.condition);
        rule.setScore(this.score);
        return rule;
    }
}

