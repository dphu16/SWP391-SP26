package com.project.hrm.module.evaluation.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class MentorAssessmentRequest {
    private UUID employeeId;
    private UUID cycleId;
    private Double teamworkScore;
    private Double communicationScore;
    private Double technicalScore;
    private Double adaptabilityScore;
}
