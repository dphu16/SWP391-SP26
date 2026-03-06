package com.project.hrm.module.evaluation.dto;

import com.project.hrm.module.evaluation.enums.EvidenceStatus;
import lombok.Data;

@Data
public class EvidenceStatusRequest {
    private EvidenceStatus status;
    private String comment;
}
