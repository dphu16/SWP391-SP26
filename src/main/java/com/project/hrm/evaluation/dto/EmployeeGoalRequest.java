package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class EmployeeGoalRequest {
    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    @NotNull(message = "cycleId is required")
    private UUID cycleId;

    @NotNull(message = "kpiLibraryId is required")
    private UUID kpiLibraryId;

    @NotBlank(message = "title is required")
    private String title;

    private BigDecimal targetValue;
    private BigDecimal weight;
    private String status = "DRAFT";

    public EmployeeGoal toEntity(){
        EmployeeGoal goal = new EmployeeGoal();
        goal.setTitle(this.title);
        goal.setTargetValue(this.targetValue);
        goal.setWeight(this.weight);
        goal.setStatus(this.status);
        return goal;
    }
}

