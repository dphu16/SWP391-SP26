package com.project.hrm.module.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "training_courses")
@Data
public class TrainingCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "name", nullable = false)
    private String courseName;

    private String description;
}
