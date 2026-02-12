package com.project.hrm.payroll.payment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue
    @Column(name = "txn_id")
    private UUID txnId;

    @ManyToOne
    @JoinColumn(name = "batch_id")
    private PaymentBatch batch;

    @Column(name = "payslip_id")
    private UUID payslipId;

    private BigDecimal amount;

    private String bankResponseCode;

    private String status; // PENDING, SUCCESS, FAILED
}
