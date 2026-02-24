package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.enums.CycleStatus;
import lombok.Data;

@Data
public class CycleStatusRequest {
    private CycleStatus status;
}