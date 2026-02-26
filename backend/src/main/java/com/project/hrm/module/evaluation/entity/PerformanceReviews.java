package com.project.hrm.module.evaluation.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.hrm.module.evaluation.enums.ReviewStatus;
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

    // GIỮ TỪ FILE 1: FetchType.LAZY tối ưu hiệu năng và JsonIgnoreProperties tránh lỗi Jackson
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PerformanceCycles cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "personal", "contracts", "dependents", "user", "department"})
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