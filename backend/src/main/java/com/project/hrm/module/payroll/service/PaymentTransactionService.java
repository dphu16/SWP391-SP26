package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentTransactionResponse;
import com.project.hrm.module.payroll.entity.PaymentTransaction;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PaymentBatchRepository;
import com.project.hrm.module.payroll.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * UR_F004: Finance xem lịch sử giao dịch ngân hàng.
 */
@Service
@RequiredArgsConstructor
public class PaymentTransactionService {

    private final PaymentTransactionRepository transactionRepository;
    private final PaymentBatchRepository paymentBatchRepository;

    /** Lấy toàn bộ lịch sử giao dịch, mới nhất trước */
    @Transactional(readOnly = true)
    public List<PaymentTransactionResponse> getAllTransactions() {
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Lấy danh sách giao dịch theo payment batch cụ thể */
    @Transactional(readOnly = true)
    public List<PaymentTransactionResponse> getTransactionsByBatch(UUID paymentBatchId) {
        // Kiểm tra batch tồn tại
        paymentBatchRepository.findById(paymentBatchId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment batch không tồn tại: " + paymentBatchId));
        return transactionRepository.findAllByPaymentBatch_PaymentBatchId(paymentBatchId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private PaymentTransactionResponse toResponse(PaymentTransaction txn) {
        String empName = null, empCode = null, deptName = null;
        if (txn.getPayslip() != null && txn.getPayslip().getEmployee() != null) {
            var emp = txn.getPayslip().getEmployee();
            empName = emp.getFullName();
            empCode = emp.getEmployeeCode();
            if (emp.getDepartment() != null) deptName = emp.getDepartment().getDeptName();
        }
        return PaymentTransactionResponse.builder()
                .txnId(txn.getTxnId())
                .paymentBatchId(txn.getPaymentBatch() != null ? txn.getPaymentBatch().getPaymentBatchId() : null)
                .payslipId(txn.getPayslip() != null ? txn.getPayslip().getPayslipId() : null)
                .employeeName(empName)
                .employeeCode(empCode)
                .departmentName(deptName)
                .amount(txn.getAmount())
                .bankReferenceNo(txn.getBankReferenceNo())
                .bankResponseCode(txn.getBankResponseCode())
                .bankResponseMsg(txn.getBankResponseMsg())
                .status(txn.getStatus())
                .createdAt(txn.getCreatedAt())
                .updatedAt(txn.getUpdatedAt())
                .build();
    }
}
