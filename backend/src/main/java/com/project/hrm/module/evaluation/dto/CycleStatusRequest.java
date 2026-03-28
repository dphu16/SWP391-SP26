package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.enums.CycleStatus;
import lombok.Data;

@Data
public class CycleStatusRequest {
    private CycleStatus status;
}