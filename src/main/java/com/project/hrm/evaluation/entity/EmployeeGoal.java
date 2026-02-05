package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "employee_goals")
@Data
public class EmployeeGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "goal_id")
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "cycle_id", nullable = false)
    private UUID cycleId;

    @Column(name = "kpi_lib_id", nullable = false)
    private UUID kpiLibId;

    private String title;

    @Column(name = "target_value")
    private BigDecimal targetValue;

    @Column(name = "current_value")
    private BigDecimal currentValue;

    private BigDecimal weight;

    private String status = "DRAFT";
}
