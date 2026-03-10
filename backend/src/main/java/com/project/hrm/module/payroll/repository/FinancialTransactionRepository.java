package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {
    List<FinancialTransaction> findByPaymentBatchId(UUID paymentBatchId);
}
