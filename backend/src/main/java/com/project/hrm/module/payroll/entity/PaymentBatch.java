package com.project.hrm.module.payroll.entity;


import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.enums.PaymentBatchStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_batches", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_batch_id")
    private UUID paymentBatchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_batch_id", nullable = false)
    private PayrollBatch payrollBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id")
    private PayrollPeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Employee processedBy;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private PaymentBatchStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
