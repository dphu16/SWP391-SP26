package com.project.hrm.evaluation.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "training_courses")
@Data
public class TrainingCourse {

    @Id
    @GeneratedValue
    private UUID courseId;

    private String name;
    private String description;
    private BigDecimal minScoreRequired;
}
