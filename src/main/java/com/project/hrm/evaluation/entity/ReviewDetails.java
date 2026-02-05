package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "review_details")
@Data

public class ReviewDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private UUID detailId;

    @Column(name = "review_id")
    private UUID reviewId;

    @Column(name = "goal_id")
    private UUID goalId;

    @Column(name = "manager_score", precision = 5, scale = 2)
    private BigDecimal managerScore;

    @Column(name = "self_score", precision = 5, scale = 2)
    private BigDecimal selfScore;

    private String comment;




}
