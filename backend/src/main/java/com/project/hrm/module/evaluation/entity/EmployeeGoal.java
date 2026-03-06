package com.project.hrm.module.evaluation.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.hrm.module.evaluation.enums.GoalStatus;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "employee_goals",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"employee_id", "cycle_id", "kpi_lib_id"}
    )
)
@Data
public class EmployeeGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "goal_id")
    private UUID goalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "personal", "contract", "dependent", "user", "department", "position", "manager"})
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PerformanceCycles cycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_lib_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private KpiLibrary kpiLibrary;

    private String title;

    @Column(name = "target_value")
    private Double targetValue;

    @Column(name = "current_value")
    private Double currentValue;

    private Double weight;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private GoalStatus status;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "image_url")
    private String imageUrl;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<GoalEvidence> evidences = new java.util.ArrayList<>();
}
