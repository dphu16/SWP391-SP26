package com.project.hrm.module.evaluation.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "training_courses")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TrainingCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "name", nullable = false)
    private String courseName;

    @Column(name = "description")
    private String description;

    @Column(name = "course_url")
    private String courseUrl;

    @Column(name = "platform")
    private String platform = "COURSERA";
}
