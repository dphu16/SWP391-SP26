package com.project.hrm.module.corehr.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "positions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "position_id")
    private UUID positionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @ToString.Exclude
    private Department department;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "base_salary_min", precision = 15, scale = 2)
    private BigDecimal baseSalaryMin;

    @Column(name = "base_salary_max", precision = 15, scale = 2)
    private BigDecimal baseSalaryMax;


}
