package com.project.hrm.payroll.payment.service;

import com.project.hrm.payroll.payment.entity.*;
import com.project.hrm.payroll.payment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PayrollPeriodRepository payrollPeriodRepository;
    private final PaymentBatchRepository paymentBatchRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    public PaymentBatch createPaymentBatch(UUID periodId, UUID processedBy) {

        PayrollPeriod period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Payroll period not found"));

        PaymentBatch batch = PaymentBatch.builder()
                .payrollPeriod(period)
                .status("PENDING")
                .processedBy(processedBy)
                .totalAmount(BigDecimal.ZERO)
                .build();

        return paymentBatchRepository.save(batch);
    }

    public PaymentTransaction createTransaction(
            PaymentBatch batch,
            UUID payslipId,
            BigDecimal amount) {

        PaymentTransaction txn = PaymentTransaction.builder()
                .batch(batch)
                .payslipId(payslipId)
                .amount(amount)
                .status("PENDING")
                .build();

        return paymentTransactionRepository.save(txn);
    }

    public List<PaymentTransaction> getTransactionsByBatch(UUID batchId) {
        return paymentTransactionRepository.findByBatch_BatchId(batchId);
    }
}
