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
        // GIỮ TỪ FILE 1: Ngăn chặn việc gán trùng lặp 1 KPI cho 1 nhân viên trong cùng 1 chu kỳ
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

    // GIỮ TỪ FILE 1: FetchType.LAZY giúp tăng hiệu năng, JsonIgnoreProperties tránh lỗi lặp vòng khi trả về JSON
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "personal", "contract", "dependent", "user", "department"})
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
}