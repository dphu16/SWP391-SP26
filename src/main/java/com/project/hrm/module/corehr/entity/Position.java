package com.project.hrm.module.corehr.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "positions")
@Data
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "position_id")
    private UUID positionId;

    @Column(name = "position_title", nullable = false, length = 100)
    private String positionTitle;

    @Column(name = "base_salary_range_min")
    private BigDecimal baseSalaryRangeMin;

    @Column(name = "base_salary_range_max")
    private BigDecimal baseSalaryRangeMax;
}
