package com.project.hrm.module.payroll.entity;

import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_details", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayrollDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payroll_id")
    private UUID payrollId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private PayrollBatch payrollBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "base_salary")
    private BigDecimal baseSalary;

    @Column(name = "total_ot_hours")
    private BigDecimal totalOtHours;

    @Column(name = "total_absent_days")
    private BigDecimal totalAbsentDays;

    @Column(name = "ot_pay")
    private BigDecimal otPay;

    @Column(name = "absent_deduction")
    private BigDecimal absentDeduction;

    @Column(name = "gross_salary")
    private BigDecimal grossSalary;

    @Column(name = "net_salary")
    private BigDecimal netSalary;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
