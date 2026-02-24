package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kpi_structures")
@Data
public class KpiStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "structure_id")
    private UUID structureId;

    @Column(name = "structure_name", nullable = false)
    private String structureName;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "total_weight")
    private Double totalWeight;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
