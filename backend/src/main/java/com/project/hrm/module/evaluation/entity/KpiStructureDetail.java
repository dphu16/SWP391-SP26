package com.project.hrm.module.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "kpi_structure_details")
@Data
public class KpiStructureDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "detail_id")
    private UUID detailId;

    @ManyToOne
    @JoinColumn(name = "structure_id")
    private KpiStructure structure;

    @ManyToOne
    @JoinColumn(name = "kpi_library_id")
    private KpiLibrary kpiLibrary;

    private Double weight;
}
