package com.project.hrm.payroll.compensation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table (name = "insurance_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsuranceConfig {
    @Id
    @GeneratedValue
    @Column (name = "id")
    private UUID id;

    @Column (name = "insurance_code")
    private String insuranceCode;

    @Column(name = "insurance_percentage", precision = 5, scale = 2)
    private BigDecimal insurancePercentage;


    @Column (name = "effective_from")
    private LocalDate effectiveFrom;

    @Column (name = "effective_to")
    private LocalDate effectiveTo;
}
