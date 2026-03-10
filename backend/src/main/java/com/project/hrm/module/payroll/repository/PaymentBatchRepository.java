package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PaymentBatch;
import com.project.hrm.module.payroll.enums.PaymentBatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentBatchRepository extends JpaRepository<PaymentBatch, UUID> {

    Optional<PaymentBatch> findTopByPayrollBatch_BatchIdOrderByCreatedAtDesc(UUID payrollBatchId);

    boolean existsByPayrollBatch_BatchIdAndStatus(UUID payrollBatchId, PaymentBatchStatus status);

    @EntityGraph(attributePaths = {"payrollBatch", "period", "processedBy"})
    Page<PaymentBatch> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"payrollBatch", "period", "processedBy"})
    Page<PaymentBatch> findByStatusOrderByCreatedAtDesc(PaymentBatchStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"payrollBatch", "period", "processedBy"})
    Page<PaymentBatch> findByPayrollBatch_BatchIdOrderByCreatedAtDesc(UUID payrollBatchId, Pageable pageable);

    @EntityGraph(attributePaths = {"payrollBatch", "period", "processedBy"})
    Page<PaymentBatch> findByPayrollBatch_BatchIdAndStatusOrderByCreatedAtDesc(
            UUID payrollBatchId,
            PaymentBatchStatus status,
            Pageable pageable);

    @EntityGraph(attributePaths = {"payrollBatch", "period", "processedBy"})
    Optional<PaymentBatch> findByPaymentBatchId(UUID paymentBatchId);
}
