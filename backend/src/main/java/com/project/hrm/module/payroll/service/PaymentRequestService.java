package com.project.hrm.module.payroll.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.payroll.dto.RequestDTO.CreatePaymentRequestRequest;
import com.project.hrm.module.payroll.dto.RequestDTO.ReviewPaymentRequestRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse;
import com.project.hrm.module.payroll.entity.*;
import com.project.hrm.module.payroll.enums.*;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final PayrollBatchRepository payrollBatchRepository;
    private final FinanceAccountRepository financeAccountRepository;
    private final PayslipRepository payslipRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;

    /**
     * HR: Tạo yêu cầu thanh toán lương gửi sang Finance.
     * [RULE] Batch phải ở trạng thái PROCESSED (đã tính toán xong và validate).
     * [RULE] Số tiền request = tổng net salary của các payslip CONFIRMED trong
     * batch.
     */
    @Transactional
    public PaymentRequestResponse createRequest(UUID requesterId, CreatePaymentRequestRequest request) {
        PayrollBatch batch = payrollBatchRepository.findById(request.getPayrollBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch không tồn tại."));

        if (batch.getStatus() != PayrollBatchStatus.VALIDATED &&
                batch.getStatus() != PayrollBatchStatus.PROCESSED &&
                batch.getStatus() != PayrollBatchStatus.LOCKED) {
            throw new PayrollException(
                    "Batch phải ở trạng thái VALIDATED, PROCESSED hoặc LOCKED trước khi thực hiện hành động này.");
        }

        FinanceAccount sourceAccount = financeAccountRepository.findById(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        if (!"ACTIVE".equals(sourceAccount.getStatus())) {
            throw new PayrollException("Tài khoản nguồn không ở trạng thái ACTIVE.");
        }

        // Tính toán số tiền dựa trên loại yêu cầu
        BigDecimal totalAmount;
        if (request.getType() == PaymentRequestType.TAX_INSURANCE) {
            // [RULE] Báo cáo bảo hiểm/thuế chỉ được gửi 1 lần duy nhất cho mỗi kỳ (batch)
            if (paymentRequestRepository.existsByPayrollBatch_BatchIdAndType(batch.getBatchId(),
                    PaymentRequestType.TAX_INSURANCE)) {
                throw new PayrollException(
                        "Báo cáo Thuế & Bảo hiểm cho kỳ lương này đã được gửi. Không thể gửi lại để tránh trùng lặp.");
            }
            BigDecimal pit = payslipRepository.sumTaxAmountByBatchId(batch.getBatchId());
            BigDecimal ins = payslipRepository.sumInsuranceAmountByBatchId(batch.getBatchId());
            totalAmount = pit.add(ins);
        } else {
            totalAmount = payslipRepository.sumNetSalaryByBatchId(batch.getBatchId());
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new PayrollException("Không có dữ liệu số tiền (hoặc phí) đã CONFIRMED trong batch này.");
        }

        // [RULE] Kiểm tra số dư tài khoản đủ không
        if (sourceAccount.getCurrentBalance().compareTo(totalAmount) < 0) {
            throw new PayrollException(
                    "Số dư tài khoản không đủ. Cần: " + totalAmount + ", Hiện có: "
                            + sourceAccount.getCurrentBalance());
        }

        Employee requester = new Employee();
        requester.setEmployeeId(requesterId);

        PaymentRequest paymentRequest = PaymentRequest.builder()
                .payrollBatch(batch)
                .requester(requester)
                .sourceAccount(sourceAccount)
                .totalAmountRequested(totalAmount)
                .reportUrl(request.getReportUrl())
                .hrNote(request.getHrNote())
                .type(request.getType())
                .status(PaymentRequestStatus.PENDING)
                .build();

        paymentRequest = paymentRequestRepository.save(paymentRequest);

        // [RULE] Nếu là yêu cầu chi LƯƠNG -> Chuyển trạng thái Batch sang PROCESSED
        if (request.getType() == com.project.hrm.module.payroll.enums.PaymentRequestType.SALARY) {
            batch.setStatus(PayrollBatchStatus.PROCESSED);
            payrollBatchRepository.save(batch);
        }

        return toResponse(paymentRequest);
    }

    /**
     * Finance: Duyệt hoặc từ chối yêu cầu thanh toán.
     */
    @Transactional
    public PaymentRequestResponse reviewRequest(UUID approverId, UUID requestId,
            ReviewPaymentRequestRequest request) {
        PaymentRequest paymentRequest = findOrThrow(requestId);

        if (paymentRequest.getStatus() != PaymentRequestStatus.PENDING) {
            throw new PayrollException("Yêu cầu này đã được xử lý rồi.");
        }

        Employee approver = new Employee();
        approver.setEmployeeId(approverId);
        paymentRequest.setApprover(approver);
        paymentRequest.setFinanceNote(request.getFinanceNote());

        if (Boolean.TRUE.equals(request.getApproved())) {
            // 1. Khấu trừ tiền từ tài khoản nguồn
            FinanceAccount sourceAccount = paymentRequest.getSourceAccount();
            BigDecimal amount = paymentRequest.getTotalAmountRequested();
            if (sourceAccount.getCurrentBalance().compareTo(amount) < 0) {
                throw new PayrollException("Số dư tài khoản không đủ để thực hiện thanh toán này.");
            }
            sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
            financeAccountRepository.save(sourceAccount);

            // 2. Cập nhật trạng thái yêu cầu sang PAID (Đã chi trả)
            paymentRequest.setStatus(PaymentRequestStatus.PAID);
            paymentRequest.setApprovedAt(OffsetDateTime.now());

            // 3. Nếu là yêu cầu chi LƯƠNG -> Chốt toàn bộ phiếu lương sang PAID
            if (paymentRequest.getType() == PaymentRequestType.SALARY) {
                List<Payslip> payslips = payslipRepository
                        .findAllByBatch_BatchId(paymentRequest.getPayrollBatch().getBatchId());
                for (Payslip p : payslips) {
                    if (p.getStatus() == PayslipStatus.CONFIRMED) {
                        p.setStatus(PayslipStatus.PAID);
                        p.setPaidAt(OffsetDateTime.now());
                    }
                }
                payslipRepository.saveAll(payslips);

                // 4. Batch cũng nên được khóa (LOCKED) sau khi đã chi trả lương
                PayrollBatch batch = paymentRequest.getPayrollBatch();
                batch.setStatus(PayrollBatchStatus.LOCKED);
                payrollBatchRepository.save(batch);

                // 5. Đồng bộ trạng thái Kỳ lương (Period) sang PAID
                com.project.hrm.module.payroll.entity.PayrollPeriod period = batch.getPeriod();
                period.setStatus(PayrollPeriodStatus.PAID);
                payrollPeriodRepository.save(period);
            }
        } else {
            paymentRequest.setStatus(PaymentRequestStatus.REJECTED);
        }

        return toResponse(paymentRequestRepository.save(paymentRequest));
    }

    /** Finance: Xem danh sách các yêu cầu PENDING */
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getPendingRequests() {
        return paymentRequestRepository.findAllByStatusOrderByCreatedAtDesc(PaymentRequestStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** HR: Xem lịch sử các yêu cầu đã tạo */
    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getMyRequests(UUID requesterId) {
        return paymentRequestRepository.findAllByRequester_EmployeeIdOrderByCreatedAtDesc(requesterId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Lay thong tin chi tiet 1 PaymentRequest */
    @Transactional(readOnly = true)
    public PaymentRequestResponse getRequestById(UUID requestId) {
        return toResponse(findOrThrow(requestId));
    }

    private PaymentRequest findOrThrow(UUID requestId) {
        return paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu thanh toán không tồn tại: " + requestId));
    }

    private PaymentRequestResponse toResponse(PaymentRequest r) {
        return PaymentRequestResponse.builder()
                .requestId(r.getRequestId())
                .payrollBatchId(r.getPayrollBatch().getBatchId())
                .requesterId(r.getRequester().getEmployeeId())
                .requesterName(r.getRequester().getFullName())
                .sourceAccountId(r.getSourceAccount() != null ? r.getSourceAccount().getAccountId() : null)
                .sourceAccountName(r.getSourceAccount() != null ? r.getSourceAccount().getAccountName() : null)
                .totalAmountRequested(r.getTotalAmountRequested())
                .status(r.getStatus())
                .type(r.getType())
                .hrNote(r.getHrNote())
                .financeNote(r.getFinanceNote())
                .reportUrl(r.getReportUrl())
                .approvedAt(r.getApprovedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
