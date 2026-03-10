package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.PaymentRequestDTO;
import com.project.hrm.module.payroll.dto.ResponseDTO.ApprovalResponseDTO;
import com.project.hrm.module.payroll.entity.FinanceAccount;
import com.project.hrm.module.payroll.entity.FinancialTransaction;
import com.project.hrm.module.payroll.entity.PaymentRequest;
import com.project.hrm.module.payroll.repository.FinanceAccountRepository;
import com.project.hrm.module.payroll.repository.FinancialTransactionRepository;
import com.project.hrm.module.payroll.repository.PaymentRequestRepository;
import com.project.hrm.module.payroll.repository.PaymentBatchRepository;
import com.project.hrm.module.payroll.entity.PaymentBatch;
import com.project.hrm.module.payroll.entity.PaymentTransaction;
import com.project.hrm.module.payroll.enums.TransactionStatus;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentBatchHistoryDTO;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentTransactionHistoryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    private final PaymentBatchRepository paymentBatchRepository;
    private final com.project.hrm.module.payroll.repository.PaymentTransactionRepository paymentTransactionRepository;

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

    // --- OTHER METHODS ---

    public List<PaymentRequest> getAllRequests() {
        return paymentRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PaymentRequest> getRequestsByStatus(String status) {
        return paymentRequestRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional
    public void rejectPaymentRequest(UUID id, String note) {
        PaymentRequest request = paymentRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment request not found: " + id));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only PENDING requests can be rejected.");
        }

        request.setStatus("REJECTED");
        request.setFinanceNote(note);
        paymentRequestRepository.save(request);
    }

    public Page<PaymentBatchHistoryDTO> getPaymentBatches(Pageable pageable) {
        return paymentBatchRepository.findAllByOrderByCreatedAtDesc(pageable).map(b -> PaymentBatchHistoryDTO.builder()
                .paymentBatchId(b.getPaymentBatchId())
                .payrollBatchId(b.getPayrollBatch() != null ? b.getPayrollBatch().getBatchId() : null)
                .month(b.getPeriod() != null ? b.getPeriod().getMonth() : null)
                .year(b.getPeriod() != null ? b.getPeriod().getYear() : null)
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .completedAt(b.getCompletedAt())
                .processedById(b.getProcessedBy() != null ? b.getProcessedBy().getEmployeeId() : null)
                .processedByName(b.getProcessedBy() != null ? b.getProcessedBy().getFullName() : null)
                .totalTransactions(
                        paymentTransactionRepository.countByPaymentBatch_PaymentBatchId(b.getPaymentBatchId()))
                .successTransactions(paymentTransactionRepository
                        .countByPaymentBatch_PaymentBatchIdAndStatus(b.getPaymentBatchId(), TransactionStatus.SUCCESS))
                .failedTransactions(paymentTransactionRepository
                        .countByPaymentBatch_PaymentBatchIdAndStatus(b.getPaymentBatchId(), TransactionStatus.FAILED))
                .build());
    }

    public Page<PaymentTransactionHistoryDTO> getPaymentTransactions(UUID batchId, Pageable pageable) {
        return paymentTransactionRepository.findHistoryByPaymentBatchId(batchId, pageable)
                .map(t -> PaymentTransactionHistoryDTO.builder()
                        .transactionId(t.getTxnId())
                        .paymentBatchId(t.getPaymentBatch().getPaymentBatchId())
                        .payslipId(t.getPayslip() != null ? t.getPayslip().getPayslipId() : null)
                        .employeeId(t.getPayslip() != null && t.getPayslip().getEmployee() != null
                                ? t.getPayslip().getEmployee().getEmployeeId()
                                : null)
                        .employeeName(t.getPayslip() != null && t.getPayslip().getEmployee() != null
                                ? t.getPayslip().getEmployee().getFullName()
                                : null)
                        .amount(t.getAmount())
                        .status(t.getStatus())
                        .bankResponseCode(t.getBankResponseCode())
                        .createdAt(t.getCreatedAt())
                        .updatedAt(t.getUpdatedAt())
                        .build());
    }

    public List<FinanceAccount> getAllAccounts() {
        return financeAccountRepository.findAll();
    }
}
