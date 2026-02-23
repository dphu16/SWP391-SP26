package com.project.hrm.evaluation.entity;
import com.project.hrm.evaluation.enums.ReviewStatus;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "performance_reviews")
@Data
public class PerformanceReviews {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "review_id")
    private UUID reviewId;

    @ManyToOne
    @JoinColumn(name = "cycle_id", nullable = false)
    private PerformanceCycles cycle;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "kpi_score")
    private Double kpiScore;

    @Column(name = "attitude_score")
    private Double attitudeScore;

    @Column(name = "overall_score")
    private Double overallScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReviewStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}