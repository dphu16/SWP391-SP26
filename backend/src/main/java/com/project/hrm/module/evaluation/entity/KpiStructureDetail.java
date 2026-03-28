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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "structure_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private KpiStructure structure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_library_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private KpiLibrary kpiLibrary;

    private Double weight;
}
