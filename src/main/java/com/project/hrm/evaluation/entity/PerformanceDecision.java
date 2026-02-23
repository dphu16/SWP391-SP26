package com.project.hrm.evaluation.entity;

import com.project.hrm.evaluation.enums.DecisionType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "performance_decisions")
@Data
public class PerformanceDecisions {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "decision_id")
    private UUID decisionId;

    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    private PerformanceReview review;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_type")
    private DecisionType decisionType;

    private String reason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}