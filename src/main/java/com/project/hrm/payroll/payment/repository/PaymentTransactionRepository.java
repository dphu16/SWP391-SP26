package com.project.hrm.payroll.payment.repository;

import com.project.hrm.payroll.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, UUID> {

    List<PaymentTransaction> findByBatch_BatchId(UUID batchId);
}
