package com.project.hrm.module.payroll.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "request_id")
    private UUID requestId;

    @Column(name = "payroll_batch_id", nullable = false)
    private UUID payrollBatchId;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "approver_id")
    private UUID approverId;

    @Column(name = "total_amount_requested", nullable = false)
    private BigDecimal totalAmountRequested;

    @Column(name = "report_url")
    private String reportUrl;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, PAID

    @Column(name = "hr_note")
    private String hrNote;

    @Column(name = "finance_note")
    private String financeNote;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
