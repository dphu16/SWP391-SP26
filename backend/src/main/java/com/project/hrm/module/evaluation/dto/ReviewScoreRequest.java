package com.project.hrm.module.evaluation.dto;

import lombok.Data;

@Data
public class ReviewScoreRequest {
    private Double kpiScore;
    private Double attitudeScore;
}
