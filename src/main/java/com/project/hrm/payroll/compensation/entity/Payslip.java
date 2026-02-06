package com.project.hrm.payroll.compensation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(
        name = "payslips",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"employee_id", "period_id"})
        }
)
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

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "period_id", nullable = false)
    private UUID periodId;

    @Column(precision = 15, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    private BigDecimal totalDeductions;

    @Column(precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Column(length = 20)
    private String status;
}
