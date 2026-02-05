package com.project.hrm.recruitment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "positions")
public class Position {

    @Id
    @Column(name = "position_id", nullable = false)
    private UUID id;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "base_salary_min", precision = 15, scale = 2)
    private BigDecimal baseSalaryMin;

    @Column(name = "base_salary_max", precision = 15, scale = 2)
    private BigDecimal baseSalaryMax;
}

