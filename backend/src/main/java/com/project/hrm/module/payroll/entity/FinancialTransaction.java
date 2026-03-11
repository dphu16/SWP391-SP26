package com.project.hrm.module.payroll.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "financial_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "txn_id")
    private UUID transactionId; // Note: Kept as transactionId in Java, but mapped to txn_id

    @Column(name = "payment_batch_id", nullable = false)
    private UUID paymentBatchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private FinanceAccount sourceAccount;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "bank_ref_code")
    private String bankRefCode;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate = LocalDateTime.now();

    private String description;
}
