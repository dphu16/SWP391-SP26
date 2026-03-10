package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.PaymentRequestDTO;
import com.project.hrm.module.payroll.dto.ResponseDTO.ApprovalResponseDTO;
import com.project.hrm.module.payroll.entity.FinanceAccount;
import com.project.hrm.module.payroll.entity.FinancialTransaction;
import com.project.hrm.module.payroll.entity.PaymentRequest;
import com.project.hrm.module.payroll.repository.FinanceAccountRepository;
import com.project.hrm.module.payroll.repository.FinancialTransactionRepository;
import com.project.hrm.module.payroll.repository.PaymentRequestRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class FinanceService {

    private final FinanceAccountRepository financeAccountRepository;
    private final PaymentRequestRepository paymentRequestRepository;
    private final FinancialTransactionRepository financialTransactionRepository;


    // --- HR ACTION: Create a request ---
    @Transactional
    public PaymentRequest createPaymentRequest(PaymentRequestDTO dto) {
        PaymentRequest request = PaymentRequest.builder()
                .payrollBatchId(dto.getPayrollBatchId())
                .requesterId(dto.getRequesterId())
                .totalAmountRequested(dto.getTotalAmountRequested())
                .reportUrl(dto.getReportUrl())
                .hrNote(dto.getHrNote())
                .status("PENDING")
                .build();
        return paymentRequestRepository.save(request);
    }

    // --- FINANCE ACTION: Get pending requests ---
    public List<PaymentRequest> getPendingRequests() {
        return paymentRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    // --- FINANCE ACTION: Approve and execute ---
    @Transactional(rollbackFor = Exception.class) // Ensures rollback if anything fails
    public String approveAndExecutePayment(ApprovalResponseDTO approval) {
        // 1. Fetch Request
        PaymentRequest request = paymentRequestRepository.findById(approval.getRequestId())
                .orElseThrow(() -> new RuntimeException("Payment request not found: " + approval.getRequestId()));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only PENDING requests can be approved.");
        }

        // 2. Fetch Source Account
        FinanceAccount account = financeAccountRepository.findById(approval.getSourceAccountId())
                .orElseThrow(() -> new RuntimeException("Source account not found."));

        // 3. Balance Check
        if (account.getCurrentBalance().compareTo(request.getTotalAmountRequested()) < 0) {
            throw new RuntimeException("Insufficient funds! Account Balance: " + account.getCurrentBalance() +
                    ", Requested: " + request.getTotalAmountRequested());
        }

        // 4. Deduct Balance
        account.setCurrentBalance(account.getCurrentBalance().subtract(request.getTotalAmountRequested()));
        financeAccountRepository.save(account);

        // 5. Create Transaction Record
        FinancialTransaction txn = new FinancialTransaction();
        // Crucial: Use the batch ID from the request as per your DB schema
        txn.setPaymentBatchId(request.getPayrollBatchId());
        txn.setSourceAccount(account);
        txn.setAmount(request.getTotalAmountRequested());
        txn.setBankRefCode(approval.getBankRefCode());
        txn.setDescription("Payroll settlement. Approved by: " + approval.getApproverId());
        financialTransactionRepository.save(txn);

        // 6. Update Request Status
        request.setStatus("PAID");
        request.setApproverId(approval.getApproverId());
        request.setFinanceNote(approval.getFinanceNote());
        paymentRequestRepository.save(request);

        // NOTE: In a complete system, you would now update the corresponding
        // PaymentBatch and PaymentDetails statuses to 'SUCCESS/COMPLETED'

        return "Payment processed successfully. Transaction ID: " + txn.getTransactionId();
    }
}
