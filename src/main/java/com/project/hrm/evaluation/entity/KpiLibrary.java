package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "kpi_libraries")
@Data
public class KpiLibrary {

    @Id
    @GeneratedValue
    @Column(name = "lib_id")
    private UUID libId;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category;
}
