package com.project.hrm.payroll.payment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_batches")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentBatch {

    @Id
    @GeneratedValue
    @Column(name = "batch_id")
    private UUID batchId;

    @ManyToOne
    @JoinColumn(name = "period_id")
    private PayrollPeriod payrollPeriod;

    private BigDecimal totalAmount;

    private UUID processedBy;

    private String status; // PENDING, PROCESSING, COMPLETED, FAILED
}