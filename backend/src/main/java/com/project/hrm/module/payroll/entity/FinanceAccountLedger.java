package com.project.hrm.module.payroll.entity;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.enums.LedgerTxnType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "finance_account_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceAccountLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ledger_id")
    private UUID ledgerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private FinanceAccount account;

    @Enumerated(EnumType.STRING)
    @Column(name = "txn_type", nullable = false)
    private LedgerTxnType txnType;

    /** CREDIT = số dương, DEBIT = số âm */
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    /** Snapshot số dư sau khi giao dịch này được ghi */
    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    /** Loại entity tham chiếu: PAYMENT_BATCH | MANUAL_TOPUP | ... */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /** ID của entity tham chiếu */
    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}