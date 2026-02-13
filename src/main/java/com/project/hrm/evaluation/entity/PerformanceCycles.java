package com.project.hrm.evaluation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "performance_cycles")
@Data
public class PerformanceCycles {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "cycle_id")
    private UUID idCycle;

    @Column(name = "cycle_name")
    private String nameCycle;

    @Column(name = "start_date")
    private LocalDate dateStart;

    @Column(name = "end_date")
    private LocalDate dateEnd;

    @Column(name = "status")
    private String status = "DRAFT";

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime dateCreate;

    @PrePersist
    protected void onCreate(){
        dateCreate = OffsetDateTime.now();
    }
}
