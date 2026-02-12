package com.project.hrm.payroll.payment.controller;

import com.project.hrm.payroll.payment.entity.PaymentBatch;
import com.project.hrm.payroll.payment.entity.PaymentTransaction;
import com.project.hrm.payroll.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/batch")
    public PaymentBatch createBatch(
            @RequestParam UUID periodId,
            @RequestParam UUID processedBy) {

        return paymentService.createPaymentBatch(periodId, processedBy);
    }

    @PostMapping("/transaction")
    public PaymentTransaction createTransaction(
            @RequestParam UUID batchId,
            @RequestParam UUID payslipId,
            @RequestParam BigDecimal amount) {

        PaymentBatch batch = new PaymentBatch();
        batch.setBatchId(batchId);

        return paymentService.createTransaction(batch, payslipId, amount);
    }

    @GetMapping("/batch/{batchId}/transactions")
    public List<PaymentTransaction> getTransactions(@PathVariable UUID batchId) {
        return paymentService.getTransactionsByBatch(batchId);
    }
}
