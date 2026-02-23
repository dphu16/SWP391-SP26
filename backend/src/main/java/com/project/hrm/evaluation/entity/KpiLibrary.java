package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import com.project.hrm.evaluation.enums.KpiCategory;

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