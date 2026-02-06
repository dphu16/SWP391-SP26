package com.project.hrm.payroll.compensation.entity;

import jakarta.persistence.*;
import lombok.*;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
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

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> allowances;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
