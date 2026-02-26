package com.project.hrm.module.evaluation.dto;

import lombok.Data;

@Data
public class DecisionRequest {
    private String type; // REWARD / TRAINING / DISCIPLINE
    private String note;
}