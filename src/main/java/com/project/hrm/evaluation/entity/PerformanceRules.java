package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "performance_rules")
@Data

public class PerformanceRules {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rule_id")
    private UUID ruleId;

    @Column(name = "min_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal minScore;

    @Column(name = "max_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal maxScore;

    @Column(name = "action", nullable = false)
    private String action;

}
