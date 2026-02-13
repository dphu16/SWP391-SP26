package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;


@Entity
@Table(name = "training_sessions")
@Data
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "session_id")
    private UUID sessionId;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private TrainingCourse course;

    @Column(name = "start_date")
    private java.time.LocalDate startDate;

    @Column(name = "end_date")
    private java.time.LocalDate endDate;

    @Column(name = "location")
    private String location;
}
