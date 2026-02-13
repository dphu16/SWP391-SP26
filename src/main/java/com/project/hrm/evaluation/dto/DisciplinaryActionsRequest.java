package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.DisciplinaryActions;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class DisciplinaryActionsRequest {
    @NotNull(message = "employeeId is required")
    private UUID employeeId;

    private String type;
    private String reason;
    private LocalDate issueDate;

    public DisciplinaryActions toEntity(){
        DisciplinaryActions action = new DisciplinaryActions();
        action.setType(this.type);
        action.setReason(this.reason);
        action.setIssueDate(this.issueDate);
        return action;
    }
}

