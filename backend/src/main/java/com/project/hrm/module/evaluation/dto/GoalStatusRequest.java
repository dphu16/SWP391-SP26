package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.enums.GoalStatus;
import lombok.Data;

@Data
public class GoalStatusRequest {
    private GoalStatus status;
}
