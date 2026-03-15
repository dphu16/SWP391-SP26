package com.project.hrm.module.payroll.entity;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "payslips",
        uniqueConstraints = @UniqueConstraint(
                name = "unique_employee_batch",
                columnNames = {"employee_id", "batch_id"}
        )
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payslip_id")
    private UUID payslipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private PayrollBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private PayrollPeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // ---- Dữ liệu chấm công ----
    @Column(name = "total_ot_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalOtHours = BigDecimal.ZERO;

    @Column(name = "total_absent_days", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalAbsentDays = BigDecimal.ZERO;

    @Column(name = "total_work_days", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalWorkDays = BigDecimal.ZERO;

    // ---- Dữ liệu tiền lương ----
    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "ot_pay", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal otPay = BigDecimal.ZERO;

    @Column(name = "absent_deduction", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal absentDeduction = BigDecimal.ZERO;

    @Column(name = "total_allowances", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAllowances = BigDecimal.ZERO;

    /** gross = base + otPay + totalAllowances - absentDeduction */
    @Column(name = "gross_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "insurance_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal insuranceAmount = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    /** net = gross - totalDeductions */
    @Column(name = "net_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PayslipStatus status = PayslipStatus.DRAFT;

    @OneToMany(mappedBy = "payslip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PayslipDetail> details;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;
}