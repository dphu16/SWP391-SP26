package com.project.hrm.module.payroll.entity;

import com.project.hrm.module.payroll.enums.PayslipStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payslips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payslip {
    @Id
    @GeneratedValue
    @Column(name = "payslip_id")
    private UUID payslipId;

    @Column(name = "employee_id")
    private UUID employeeId;

    @Column(name = "period_id")
    private UUID periodId;

    @Column(name = "base_salary")
    private BigDecimal baseSalary;

    @Column(name = "total_allowances")
    private BigDecimal totalAllowances;

    @Column(name = "gross_salary", precision = 15, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "tax_amount")
    private BigDecimal taxAmount;

    @Column(name = "insurance_amount")
    private BigDecimal insuranceAmount;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private PayslipStatus status;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
