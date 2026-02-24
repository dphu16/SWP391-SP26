package com.project.hrm.evaluation.entity;

import com.project.hrm.evaluation.enums.GoalStatus;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "employee_goals")
@Data
public class EmployeeGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "goal_id")
    private UUID goalId;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "cycle_id", nullable = false)
    private PerformanceCycles cycle;

    @ManyToOne
    @JoinColumn(name = "kpi_lib_id", nullable = false)
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
}