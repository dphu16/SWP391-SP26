package com.project.hrm.module.evaluation.dto;

import lombok.Data;

@Data
public class GoalProgressRequest {
    private Double actualValue;
    private String comment;
    private String imageUrl;
}
