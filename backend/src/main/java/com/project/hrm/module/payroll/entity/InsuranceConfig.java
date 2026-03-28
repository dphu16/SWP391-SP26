package com.project.hrm.module.payroll.entity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "insurance_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsuranceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "insurance_code", nullable = false)
    private String insuranceCode;

    @Column(name = "insurance_name")
    private String insuranceName;

    @Column(name = "insurance_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal insurancePercentage;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;
}
