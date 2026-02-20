package com.project.hrm.evaluation.entity;

import com.project.hrm.module.corehr.entity.Employee;
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

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private PerformanceCycles cycle;

    @ManyToOne
    @JoinColumn(name = "kpi_lib_id")
    private KpiLibrary kpiLibrary;

    private String title;

    @Column(name = "target_value")
    private BigDecimal targetValue;

    @Column(name = "current_value")
    private BigDecimal currentValue;

    private BigDecimal weight;

    private String status = "DRAFT";
}
