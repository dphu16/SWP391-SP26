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

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private KpiCategory category;
}
