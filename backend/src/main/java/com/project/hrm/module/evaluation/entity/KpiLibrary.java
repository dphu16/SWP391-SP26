package com.project.hrm.module.evaluation.entity;

import jakarta.persistence.*;
import com.project.hrm.module.evaluation.enums.KpiCategory;
import com.project.hrm.module.evaluation.enums.MeasurementType;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KpiCategory category;

    @Column(name = "default_weight")
    private Double defaultWeight;

    @Enumerated(EnumType.STRING)
    @Column(name = "measurement_type", length = 20)
    private MeasurementType measurementType = MeasurementType.NUMERIC;
}