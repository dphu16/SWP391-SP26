package com.project.hrm.module.corehr.entity;

import java.time.LocalDate;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dependents")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Dependent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "dependent_id")
    private UUID dependentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(length = 50)
    private String relationship;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "is_tax_deductible")
    private Boolean isTaxDeductible = true;
}
