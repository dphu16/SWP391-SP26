package com.project.hrm.module.payroll.entity;


import com.project.hrm.module.payroll.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Bảng log giao dịch thực tế với API Ngân hàng.
 * Mỗi dòng = 1 lần gọi API bank (hoặc webhook phản hồi từ bank).
 *
 * Quan hệ:
 *   - payment_batch_id → PaymentBatch (batch nào phát sinh giao dịch này)
 *   - payslip_id       → Payslip (nhân viên nào được chuyển khoản)
 *   - source_account_id→ FinanceAccount (tiền xuất từ tài khoản nào)
 */
@Entity
@Table(name = "payment_transactions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private FinanceAccount sourceAccount;

    /** Mã tham chiếu nội bộ từ phía ngân hàng (dùng để đối soát) */
    @Column(name = "bank_reference_no", length = 100)
    private String bankReferenceNo;

    /** Mã lỗi hoặc thành công từ response của ngân hàng */
    @Column(name = "bank_response_code", length = 50)
    private String bankResponseCode;

    /** Thông điệp đầy đủ từ ngân hàng (lưu để debug khi thất bại) */
    @Column(name = "bank_response_msg", columnDefinition = "TEXT")
    private String bankResponseMsg;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
