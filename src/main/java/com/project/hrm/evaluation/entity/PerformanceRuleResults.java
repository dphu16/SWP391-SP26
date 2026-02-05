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

    @Column(name = "review_id", nullable = false)
    private UUID reviewId;

    @Column(name = "rule_id", nullable = false)
    private UUID ruleId;

    @Column(name = "applied_action")
    private String appliedAction;

}
