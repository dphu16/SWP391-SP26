package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;


@Entity
@Table(name = "training_sessions")
@Data
public class TrainingSession {

    @Id
    @GeneratedValue
    private UUID sessionId;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private TrainingCourse course;

    private String trainerName;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String location;
}
