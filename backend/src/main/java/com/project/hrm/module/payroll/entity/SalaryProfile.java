package com.project.hrm.module.payroll.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "salary_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryProfile {
    @Id
    @GeneratedValue
    @Column(name = "profile_id")
    private UUID profileId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowances", columnDefinition = "jsonb")
    private Map<String, Object> allowances;

    @Column(name = "tax_code")
    private String taxCode;

    @Column(name = "insurance_code")
    private String insuranceCode;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false)
    private LocalDateTime updatedAt;
}
