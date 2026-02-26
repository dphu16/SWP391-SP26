package com.project.hrm.module.payroll.entity;


import com.project.hrm.module.payroll.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "txn_id")
    private UUID txnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_batch_id", nullable = false)
    private PaymentBatch paymentBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", nullable = false)
    private Payslip payslip;

    private BigDecimal amount;

    @Column(name = "bank_response_code")
    private String bankResponseCode;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
