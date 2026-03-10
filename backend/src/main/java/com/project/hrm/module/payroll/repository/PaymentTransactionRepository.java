package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PaymentTransaction;
import com.project.hrm.module.payroll.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    long countByPaymentBatch_PaymentBatchIdAndStatus(UUID paymentBatchId, TransactionStatus status);

    long countByPaymentBatch_PaymentBatchId(UUID paymentBatchId);

    @Query(value = "SELECT pt FROM PaymentTransaction pt " +
            "JOIN FETCH pt.payslip p " +
            "JOIN FETCH p.employee e " +
            "WHERE pt.paymentBatch.paymentBatchId = :paymentBatchId " +
            "ORDER BY pt.createdAt DESC", countQuery = "SELECT COUNT(pt) FROM PaymentTransaction pt " +
            "WHERE pt.paymentBatch.paymentBatchId = :paymentBatchId")
    Page<PaymentTransaction> findHistoryByPaymentBatchId(
            @Param("paymentBatchId") UUID paymentBatchId,
            Pageable pageable);

    @Query(value = "SELECT pt FROM PaymentTransaction pt " +
            "JOIN FETCH pt.payslip p " +
            "JOIN FETCH p.employee e " +
            "WHERE pt.paymentBatch.paymentBatchId = :paymentBatchId " +
            "AND pt.status = :status " +
            "ORDER BY pt.createdAt DESC", countQuery = "SELECT COUNT(pt) FROM PaymentTransaction pt " +
            "WHERE pt.paymentBatch.paymentBatchId = :paymentBatchId " +
            "AND pt.status = :status")
    Page<PaymentTransaction> findHistoryByPaymentBatchIdAndStatus(
            @Param("paymentBatchId") UUID paymentBatchId,
            @Param("status") TransactionStatus status,
            Pageable pageable);
}
