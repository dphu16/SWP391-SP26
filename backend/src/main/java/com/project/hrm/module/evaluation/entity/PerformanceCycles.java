package com.project.hrm.module.evaluation.entity;

import com.project.hrm.module.evaluation.enums.CycleStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "performance_cycles")
@Data
public class PerformanceCycles {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "cycle_id")
    private UUID cycleId;

    @Column(name = "cycle_name", nullable = false)
    private String cycleName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CycleStatus status;

    @Column(name = "kpi_weight")
    private Double kpiWeight = 70.0;

    @Column(name = "attitude_weight")
    private Double attitudeWeight = 30.0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
