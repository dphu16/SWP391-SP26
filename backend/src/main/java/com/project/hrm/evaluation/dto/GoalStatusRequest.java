package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.enums.GoalStatus;
import lombok.Data;

@Data
public class GoalStatusRequest {
    private GoalStatus status;
}
