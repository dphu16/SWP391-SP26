package com.project.hrm.evaluation.entity;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "performance_reviews")
@Data
public class PerformanceReviews {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "review_id")
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "cycle_id", nullable = false)
    private UUID cycleId;

    @Column(name = "manager_id", nullable = false)
    private UUID managerId;

    @Column(name = "final_score", precision = 5, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "rating")
    private String rating;

    @Column(name = "status")
    private String status = "PENDING";


}
