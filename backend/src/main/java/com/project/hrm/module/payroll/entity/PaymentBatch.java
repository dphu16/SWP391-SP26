package com.project.hrm.module.payroll.entity;


import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.enums.PaymentBatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "payment_batches")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_batch_id")
    private UUID paymentBatchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_batch_id", nullable = false)
    private PayrollBatch payrollBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_request_id")
    private PaymentRequest paymentRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id")
    private PayrollPeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private Employee processedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id", nullable = false)
    private FinanceAccount sourceAccount;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentBatchStatus status = PaymentBatchStatus.PENDING;

    @OneToMany(mappedBy = "paymentBatch", cascade = CascadeType.ALL)
    private List<PaymentDetail> details;

    /** Log giao dịch thực tế gửi lên bank — dùng để audit và retry khi FAILED */
    @OneToMany(mappedBy = "paymentBatch", cascade = CascadeType.ALL)
    private List<PaymentTransaction> transactions;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
