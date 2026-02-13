package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;


@Entity
@Table(name = "performance_rule_results")
@Data
public class PerformanceRuleResults {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "result_id")
    private UUID resultId;

    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    private PerformanceReviews review;

    @ManyToOne
    @JoinColumn(name = "rule_id", nullable = false)
    private PerformanceRules rule;

    @Column(name = "result_score")
    private java.math.BigDecimal resultScore;
}
