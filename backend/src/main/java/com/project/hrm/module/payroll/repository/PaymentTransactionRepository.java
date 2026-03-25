package com.project.hrm.module.payroll.repository;

import com.project.hrm.module.payroll.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.UUID;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    List<PaymentTransaction> findAllByPaymentBatch_PaymentBatchId(UUID paymentBatchId);
    List<PaymentTransaction> findAllByPayslip_PayslipId(UUID payslipId);
    List<PaymentTransaction> findAll(Sort sort);
}
