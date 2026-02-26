package com.project.hrm.module.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "review_details")
@Data
public class ReviewDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "detail_id")
    private UUID detailId;

    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    private PerformanceReviews review;

    @ManyToOne
    @JoinColumn(name = "goal_id", nullable = false)
    private EmployeeGoal goal;

    @Column(name = "score")
    private BigDecimal score;

    @Column(name = "comment")
    private String comment;
}

