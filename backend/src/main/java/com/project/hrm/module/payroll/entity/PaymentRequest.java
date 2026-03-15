package com.project.hrm.module.payroll.entity;

import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import com.project.hrm.module.payroll.enums.PaymentRequestType;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_requests")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "request_id")
    private UUID requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_batch_id", nullable = false)
    private PayrollBatch payrollBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private Employee requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private Employee approver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private FinanceAccount sourceAccount;

    @Column(name = "total_amount_requested", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmountRequested;

    @Column(name = "report_url")
    private String reportUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PaymentRequestStatus status = PaymentRequestStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 30)
    @Builder.Default
    private PaymentRequestType type = PaymentRequestType.SALARY;

    @Column(name = "hr_note", columnDefinition = "TEXT")
    private String hrNote;

    @Column(name = "finance_note", columnDefinition = "TEXT")
    private String financeNote;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
