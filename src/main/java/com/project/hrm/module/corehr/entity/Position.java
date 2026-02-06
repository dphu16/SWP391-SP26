package com.project.hrm.module.corehr.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "positions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "position_id")
    private UUID positionId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "base_salary_min", precision = 15, scale = 2)
    private BigDecimal baseSalaryMin;

    @Column(name = "base_salary_max", precision = 15, scale = 2)
    private BigDecimal baseSalaryMax;

    @Column(columnDefinition = "TEXT")
    private String description;
}
