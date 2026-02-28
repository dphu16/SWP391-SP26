package com.project.hrm.module.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "kpi_libraries")
@Data
public class KpiLibrary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "lib_id")
    private UUID libId;

    @Column(nullable = false)
    private String name;

    private String description;
    private String category;

    @Column(name = "default_weight")
    private Double defaultWeight;
}